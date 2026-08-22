<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Dayflow collaboration rules

Before making changes, every agent must read PROJECT_CONTEXT.md, TASK_BOARD.md,
and CHANGELOG.md. Read API_CONTRACT.md and DATABASE_SCHEMA.md whenever work
touches data, authentication, server actions, route handlers, or shared types.

Respect the ownership map in PROJECT_CONTEXT.md. Do not edit another laptop's
feature module. Shared files are owned by Laptop 1; propose shared contract
changes before editing them and document every accepted contract change in the
relevant contract document and CHANGELOG.md.

After meaningful work:

1. Update only your laptop section in CHANGELOG.md and TASK_BOARD.md.
2. Run npm run lint, npm run typecheck, and npm run build.
3. Commit on your laptop branch with a focused conventional commit message.
4. Push the branch and hand the commit hash to Laptop 1 for integration.
