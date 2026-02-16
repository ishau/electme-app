# ElectMe App

## Tech Stack
- Next.js app router with `(app)` route group — fully client-side SPA, no SSR data fetching
- Go backend API — all response fields are PascalCase (e.g., `CandidateType`, `IsOwnCandidate`)
- TanStack Query for data fetching (`useQuery`) and cache invalidation after mutations (`queryClient.invalidateQueries`)
- UI: shadcn/ui components in `/components/ui`
- nuqs for URL search param state in filter components (`useQueryStates`, `parseAsString`)

## Key Files
- `/lib/types.ts` — all TypeScript interfaces for API responses
- `/lib/api.ts` — API client (`get`, `post`, `put`, `del`) using `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_GROUP_ID` env vars
- `/lib/hooks/` — TanStack Query hooks for all data fetching (useGroup, useConstituents, useCandidateVoters, etc.)
- `/lib/mutations.ts` — all mutation functions (replaces old server actions)
- `/components/providers.tsx` — QueryClientProvider + TooltipProvider
- `/components/layout/app-layout-content.tsx` — client component for layout data fetching

## Architecture
- All pages are `"use client"` — data fetched via hooks, mutations via `lib/mutations.ts`
- `keepPreviousData` on filter-dependent hooks to prevent "No results" flash during refetch
- Layout split: `app/(app)/layout.tsx` (server component with `<Suspense>` + `<NuqsAdapter>`) wraps `AppLayoutContent` (client component)
- Loading skeletons: use `PageSkeleton`/`TableSkeleton` from `components/shared/loading-skeleton.tsx` gated on `isLoading`

## Commands
- `npm run build` — build (uses Turbopack)
- `npm run dev` — dev server

## Gotchas
- `useSearchParams()`/nuqs requires a `<Suspense>` boundary — the layout handles this, don't make `layout.tsx` a client component
- API enum/type values (e.g., `CandidateType`) use inconsistent casing — can be `"Mayor"`, `"WDC President"`, or `"council_member"`. Always normalize (lowercase + replace spaces with underscores) before comparing.
- `/groups/{groupId}/constituents` returns `PaginatedResponse<T>` (`{ data, total, limit, offset }`), not a plain array
- `/groups/{groupId}/constituents` supports optional `constituency_id` param — omit it to fetch across all constituencies
- All date/age calculations use GMT+5 (Maldives timezone)
- Multi-constituency types: `["president", "mayor", "wdc_president"]` are global — always normalize with `type.toLowerCase().replace(/\s+/g, "_")` before comparing
- Voter add/import and party management are backend-only — no frontend CRUD for these
