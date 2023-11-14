# Lumen

Fictional medspa demo site: care menu and consultation enquiry. Keep new work inside that scope. Demo records were created for this project only.

- `app/` — pages, layout, global styles, and fonts
- `app/api/services` — current care menu
- `app/api/form-token` — short-lived form challenge
- `app/api/consultations` — save an enquiry
- `components/` — header, hero, care menu, consultation form, footer
- `lib/` — shared types, form client, enquiry checks, and database access
- `supabase/migrations/` — services and enquiry tables

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
