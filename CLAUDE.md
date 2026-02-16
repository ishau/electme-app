# ElectMe App

## Tech Stack
- Next.js app router with `(app)` route group
- Go backend API — all response fields are PascalCase (e.g., `CandidateType`, `IsOwnCandidate`)
- UI: shadcn/ui components in `/components/ui`
- nuqs for URL search param state in filter components (`useQueryStates`, `parseAsString`)
- `NuqsAdapter` wraps children in `app/(app)/layout.tsx`

## Key Files
- `/lib/types.ts` — all TypeScript interfaces for API responses
- `/lib/api.ts` — API client (`get`, `post`, `put`, `del`) using `API_URL` and `GROUP_ID` env vars
- `/lib/actions/` — server actions

## Gotchas
- API enum/type values (e.g., `CandidateType`) use inconsistent casing — can be `"Mayor"`, `"WDC President"`, or `"council_member"`. Always normalize (lowercase + replace spaces with underscores) before comparing.
- `/groups/{groupId}/constituents` returns `PaginatedResponse<T>` (`{ data, total, limit, offset }`), not a plain array
- All date/age calculations use GMT+5 (Maldives timezone)
- Multi-constituency types: `["president", "mayor", "wdc_president"]` are global — always normalize with `type.toLowerCase().replace(/\s+/g, "_")` before comparing
- Voter add/import and party management are backend-only — no frontend CRUD for these
