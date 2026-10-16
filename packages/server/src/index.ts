import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import type { FastifyError } from 'fastify'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import { getDefaultAdminKey, getMasterToken } from './db' // Side effect: opens DB, migrates, seeds
import { sessionRoutes } from './routes/sessions'
import { adminRoutes } from './routes/admin'
import { masterRoutes } from './routes/master'
import { PORT, HOST, CLIENT_URL, MASTER_TOKEN_ENV, IS_PROD } from './config'

/**
 * Server entry point: registers CORS and all API routes and, in production, serves the built
 * client as SPA from the same origin.
 */

/** Built client bundle; served only if it exists (production). */
const CLIENT_DIST = fileURLToPath(new URL('../../client/dist', import.meta.url))

/**
 * Builds and starts the Fastify app.
 *
 * In dev it logs the admin link of the default session and, unless the master token comes from
 * `MASTER_TOKEN`, the master link.
 *
 * @returns {Promise<void>}
 */
async function start() {
  // Admin key and master token are part of the URL PATH and must never reach the log; the
  // serializer masks them in the error logs that occur despite `disableRequestLogging`.
  const app = Fastify({
    logger: {
      serializers: {
        req: (req) => ({
          method: req.method,
          url: req.url.replace(/^(\/api\/(?:admin|master))\/[^/?]+/, '$1/***'),
        }),
      },
    },
    disableRequestLogging: true,
  })

  // `disableRequestLogging` also disables Fastify's own error log, so 5xx are logged here.
  app.setErrorHandler<FastifyError>((err, req, reply) => {
    if ((err.statusCode ?? 500) >= 500) {
      req.log.error({ err, req }, 'Request fehlgeschlagen')
    }
    reply.send(err)
  })

  await app.register(cors, { origin: true })

  /**
   * GET /health — liveness probe; public.
   *
   * @returns {object} `{ ok: true }`.
   */
  app.get('/health', async () => ({ ok: true }))
  await app.register(sessionRoutes)
  await app.register(adminRoutes)
  await app.register(masterRoutes)

  if (existsSync(CLIENT_DIST)) {
    await app.register(fastifyStatic, { root: CLIENT_DIST })
    // SPA fallback: unknown GETs outside the API get `index.html`, everything else 404.
    app.setNotFoundHandler((req, reply) => {
      if (
        req.method === 'GET' &&
        !req.url.startsWith('/api') &&
        !req.url.startsWith('/health')
      ) {
        return reply.sendFile('index.html')
      }
      reply.code(404).send({ error: 'Not Found' })
    })
  }

  await app.listen({ port: PORT, host: HOST })

  // The links contain secrets — logged in dev only.
  if (IS_PROD) {
    app.log.info('Server bereit. Verwaltungslinks werden in Produktion nicht geloggt.')
  } else {
    app.log.info(
      `Standard-Sitzung – Verwaltung: ${CLIENT_URL}/?admin=${getDefaultAdminKey()}`,
    )
    if (MASTER_TOKEN_ENV) {
      app.log.info('Master-Token aus MASTER_TOKEN (Env) — Link nicht geloggt.')
    } else {
      app.log.info(`Master-Auswertung: ${CLIENT_URL}/?master=${getMasterToken()}`)
    }
  }
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
