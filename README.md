# PQL Command

A pipeline manager for importing product-qualified leads, reviewing qualification
and enrichment results, and editing outreach drafts.

## Development

Use Node.js 20 or newer and npm. Install the dependencies and start the frontend:

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:8080. The complete import and processing workflow also
requires the database and the companion [PQL Agents API](https://github.com/mattheim/pql-agents-api).
See [Local development](LOCAL_DEVELOPMENT.md) for configuration and restart
instructions. Use [sample-pqls.csv](sample-pqls.csv) to test imports.

## Commands

```sh
npm run build     # Production build in dist/
npm run preview   # Preview the production build locally
npm test         # Run the test suite
npm run lint     # Check source code
npm run db:start # Start the configured local database services
```

## Stack

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, and TanStack Query power the
frontend. Supabase stores pipeline data, and the Python API handles qualification,
enrichment, and email draft generation.

## Deployment

Build with `npm run build` and serve `dist/` using a static host configured to
route application paths to `index.html`. Configure the frontend database URL and
publishable key for the target environment before building. Set the Agents API
base URL in `src/lib/constants.ts` to the deployed backend address and configure
the backend's allowed origins for the frontend domain.
