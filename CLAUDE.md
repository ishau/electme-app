# ElectMe App

## Tech Stack
- Next.js app router with `(app)` route group
- Go backend API — all response fields are PascalCase (e.g., `CandidateType`, `IsOwnCandidate`)
- UI: shadcn/ui components in `/components/ui`

## Key Files
- `/lib/types.ts` — all TypeScript interfaces for API responses
- `/lib/api.ts` — API client (`get`, `post`, `put`, `del`) using `API_URL` and `GROUP_ID` env vars
- `/lib/actions/` — server actions

## Gotchas
- API enum/type values (e.g., `CandidateType`) use inconsistent casing — can be `"Mayor"`, `"WDC President"`, or `"council_member"`. Always normalize (lowercase + replace spaces with underscores) before comparing.
