# Local PQL development

The checked-in frontend `.env` points to a hosted project that was unreachable
during setup. This machine now uses a local Supabase database via ignored
`.env.local` overrides in both `pql-pipeline-pilot` and `agents_api`.
Local data is separate from the hosted project.

## Restart

Start Docker Desktop, then run from this directory:

```sh
npm run db:start
npm run dev -- --host 127.0.0.1
```

In another terminal, from the parent `heim_lovable_gtm` directory:

```sh
./agents_api/.venv/bin/python -m uvicorn agents_api.main:app --reload --port 8000
```

Open http://127.0.0.1:8080/upload and upload `sample-pqls.csv`.
Each import creates new rows. Processing creates drafts but does not send email.

## Configuration

- Frontend `.env.local`: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- API `.env.local`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `MODEL_NAME`.
- API `.env`: existing LLM credentials. The API loads files relative to `config.py`,
  with `.env.local` taking precedence over `.env`. Explicit process environment
  variables take precedence over both, so omit `--env-file agents_api/.env`
  when starting Uvicorn with local overrides.
- The local model override is `gpt-6-luna`; the previous `gpt-4.1-nano` returned
  a model-deprecated error. A live request verified the replacement works.

On a new machine, install dependencies with `npm ci` and create the development
Docker network before starting the database:

```sh
docker network create -o com.docker.network.bridge.host_binding_ipv4=127.0.0.1 pql-local
npm run db:start
npx supabase status -o env
```

Copy the API URL and publishable key into the frontend overrides, and the API URL
and **service-role** key into the backend overrides. Never put a service-role key
in a `VITE_` variable. Restart the API and refresh the browser after changes.

The first database start applies the checked-in migration. This machine uses the
already-cached Postgres image `17.6.1.063`, selected by the ignored
`supabase/.temp/postgres-version` file after registry downloads stalled.
Database Docker volumes persist across restarts. The minimal stack excludes
Studio, Storage, Realtime, and Edge Functions, which CSV import does not require.
Sending email through the Edge Function is outside this local setup.

Docker Desktop currently publishes ports 54321 and 54322 on all host interfaces,
despite the network's loopback binding option. This database uses development
credentials and the repository's permissive policies; keep it on a trusted
development machine and do not expose those ports publicly.

If import fails, check Docker and the database connection first. If the app says
“PQLs saved; processing incomplete,” check the API logs and retry enrichment from
the dashboard instead of importing duplicate rows.
