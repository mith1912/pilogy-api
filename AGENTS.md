<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Backend conventions

- Keep this service stateless: no profile/result persistence, database, or authentication in V1.
- Never log submitted names, dates, bodies, results, or raw validation errors.
- Implement only the supplied V1 rules and examples in docs/calculation-rules.md. Do not invent new conventions or add interpretations without approved content.
- Keep routes under app/api/v1 thin. Put Zod schemas in lib/validation and pure calculations in versioned lib/numerology modules.
- Use shared response/error utilities, bound streamed input bytes, and never expose environment secrets.
- No instance-local rate limiter; configure platform/distributed limiting before public release.
- Run npm run lint, npm run type-check, npm test, and npm run build after meaningful backend changes.
- Preserve the generated Next.js instruction block above. Read the bundled Next.js documentation before changes involving its APIs.
