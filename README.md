# ML-Sortiertool

A digital card sorting tool for the formative assessment of students' conceptual understanding of machine learning concepts. Learners freely group short problem descriptions; a teacher dashboard compares their sortings with expert structures.

## Getting started

Requires **Node.js ≥ 22.5** (for the built-in `node:sqlite`). npm workspaces monorepo: `packages/client` (React/Vite), `packages/server` (Fastify + SQLite), `packages/shared` (data model, card set). Run all commands from the repository root.

**Development**

```
npm install
npm run dev        # server on :3001 and client on :5173
```

Open <http://localhost:5173>. Vite proxies `/api` and `/health` to the server.

**Production**

```
npm ci
npm run build      # builds the client into packages/client/dist
NODE_ENV=production MASTER_TOKEN=<secret> DB_PATH=/var/lib/cardsort/db.sqlite npm start
```

The server then serves client and API together on <http://localhost:3001>. Put a reverse proxy with TLS in front of it. Alternatively, build the image from the included `Dockerfile` and pass the same environment variables.

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | – | Set to `production`: suppresses startup links containing admin keys and the master token, and request logging. |
| `PORT` / `HOST` | `3001` / `0.0.0.0` | Bind port and address. |
| `DB_PATH` | `packages/server/data/ml-sortiertool.sqlite` | SQLite file; place it on persistent storage outside the repository. |
| `MASTER_TOKEN` | generated on first start | Secret for the cross-session research view (`/?master=<token>`). If unset, a token is generated and stored in the database. |

Admin keys and the master token appear in URL paths (`/api/admin/<key>`, `/api/master/<token>`) – make sure your reverse proxy does not write them to its access logs.

## License

- **Code:** [GNU AGPL v3 or later](LICENSE)
- **Content** – card texts and images, reference schemas, coding scheme (`packages/shared/cards.json`, `schemas.json`, `name-markers.json`, `packages/client/public/cards/`): [CC BY 4.0](LICENSES/CC-BY-4.0.txt)

The exact per-file assignment is defined in [`REUSE.toml`](REUSE.toml) ([REUSE specification](https://reuse.software)).

Attribution for the content: *ML-Sortiertool card set by Erik Marx, Clemens Witt and Konrad Schäfer, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).*
<!-- Once the card set has been archived, append its DOI: https://doi.org/10.5281/zenodo.XXXXXXX -->

```
ML-Sortiertool – card sorting tool for the formative assessment of ML understanding
Copyright (C) 2026  Erik Marx, Clemens Witt

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```

If you run a modified version of this tool as a network service, the AGPL requires you to offer its source code to its users. The link is set in `SOURCE_URL` (`packages/client/src/lib/config.ts`) and shown in the menu and on the legal page.

## Citation

If you use this tool in teaching or research, please cite this repository (see [`CITATION.cff`](CITATION.cff), or "Cite this repository" on GitHub):

> Marx, E., & Witt, C. (2026). *ML-Sortiertool* [Computer software]. https://github.com/EMDDITUD/cardsort-assessment

## Contact

Erik Marx, TUD Dresden University of Technology, 01062 Dresden, Germany – [erik.marx@tu-dresden.de](mailto:erik.marx@tu-dresden.de)
