import { fileURLToPath } from 'node:url'

/**
 * Server configuration from environment variables, with dev defaults.
 */

/** Default SQLite file under `packages/server/data/`. */
const DEFAULT_DB = fileURLToPath(
  new URL('../data/ml-sortiertool.sqlite', import.meta.url),
)

/** Whether `NODE_ENV` is `production`. */
export const IS_PROD = process.env.NODE_ENV === 'production'
/** HTTP port (`PORT`, default 3001). */
export const PORT = Number(process.env.PORT ?? 3001)
/** Bind address (`HOST`, default all interfaces). */
export const HOST = process.env.HOST ?? '0.0.0.0'
/** Public client URL, used for the links logged at startup (`CLIENT_URL`). */
export const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173'
/** Path of the SQLite file (`DB_PATH`). */
export const DB_PATH = process.env.DB_PATH ?? DEFAULT_DB
/** `MASTER_TOKEN` from the env; if unset, {@link getMasterToken} generates and persists one. */
export const MASTER_TOKEN_ENV = process.env.MASTER_TOKEN || undefined
