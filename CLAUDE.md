# ElectMe App

## Tech Stack
- Next.js app router with `(app)` route group — pages are client-side, auth/proxy via API routes (SSR)
- Go backend API — all response fields are PascalCase (e.g., `CandidateType`, `IsOwnCandidate`)
- TanStack Query for data fetching (`useQuery`) and cache invalidation after mutations (`queryClient.invalidateQueries`)
- UI: shadcn/ui components in `/components/ui`
- nuqs for URL search param state in filter components (`useQueryStates`, `parseAsString`)
- Auth: HttpOnly cookie session, Next.js API routes for login/logout, catch-all proxy for Go backend

## Key Files
- `/lib/types.ts` — all TypeScript interfaces for API responses
- `/lib/auth.ts` — auth utilities (login, logout, fetchUser) — all call Next.js API routes
- `/lib/api.ts` — API client (`get`, `post`, `put`, `del`) — calls `/api/backend/*` proxy (same-origin)
- `/lib/hooks/use-auth.ts` — `useAuth()` hook for current user info (calls `/api/auth/me`)
- `/lib/hooks/` — TanStack Query hooks for all data fetching (useGroup, useConstituents, useCandidateVoters, etc.)
- `/lib/mutations.ts` — all mutation functions
- `/app/api/auth/` — login (POST), logout (POST), me (GET) — server-side, manages HttpOnly cookie
- `/app/api/backend/[...path]/route.ts` — catch-all proxy: reads cookie, forwards to Go with Authorization header
- `/components/auth-guard.tsx` — uses `useAuth()`, redirects to /login if not authenticated
- `/components/providers.tsx` — QueryClientProvider + TooltipProvider
- `/components/layout/app-layout-content.tsx` — client component for layout data fetching

## Architecture
- All pages are `"use client"` — data fetched via hooks, mutations via `lib/mutations.ts`
- **Auth flow**: Login form → `POST /api/auth/login` (Next.js API route) → proxies to Go backend → sets HttpOnly `session` cookie with JWT → returns user info. Logout via `POST /api/auth/logout` (clears cookie).
- **API proxy**: All client API calls go to `/api/backend/*` (same-origin). The catch-all route reads the HttpOnly cookie and forwards to Go backend with `Authorization: Bearer` header. Client JS never sees the JWT.
- **Security**: HttpOnly cookie (XSS-immune), SameSite=Lax (CSRF protection), Secure in production.
- Group-scoped API routes use `/group/...` (singular, group from JWT). Unprotected routes (geography, parties, base constituents) use original paths.
- `AuthGuard` in `app/(app)/layout.tsx` uses `useAuth()` hook to check session. Login page at `app/login/page.tsx`.
- `keepPreviousData` on filter-dependent hooks to prevent "No results" flash during refetch
- Layout split: `app/(app)/layout.tsx` (server component with `<Suspense>` + `<NuqsAdapter>`) wraps `AuthGuard` > `AppLayoutContent` (client component)
- Loading skeletons: use `PageSkeleton`/`TableSkeleton` from `components/shared/loading-skeleton.tsx` gated on `isLoading`

## Environment Variables
- `BACKEND_URL` — Go backend URL (server-only, default: `http://localhost:8080/api/v1`)
- No `NEXT_PUBLIC_*` env vars needed — client calls same-origin proxy

## Commands
- `npm run build` — build (uses Turbopack)
- `npm run dev` — dev server

## Gotchas
- Go backend returns PascalCase keys in ALL responses including login (`Token`, `GroupID`, `ExpiresAt`) — API route handlers in `app/api/` must use PascalCase when reading backend responses (e.g., `data.Token` not `data.token`)
- `useSearchParams()`/nuqs requires a `<Suspense>` boundary — the layout handles this, don't make `layout.tsx` a client component
- API enum/type values (e.g., `CandidateType`) use inconsistent casing — can be `"Mayor"`, `"WDC President"`, or `"council_member"`. Always normalize (lowercase + replace spaces with underscores) before comparing.
- `/group/constituents` returns `PaginatedResponse<T>` (`{ data, total, limit, offset }`), not a plain array
- `/group/constituents` supports optional `constituency_id` param — omit it to fetch across all constituencies
- Age is server-calculated (integer, nullable) — no client-side DOB conversion needed
- `PermanentAddress` includes `IslandName` — display as "Address / IslandName"
- `ContactInfo` has only `PhoneNumbers` and `Email` (no MobileNumbers/Viber)
- `ConstituentSearchResult.PermanentAddress` is a plain string (not the nested object)
- Relationships use `RelationshipView` — API returns `PersonID`, `Name`, `Address`, `RelLabel`, `Derived`, `Score` (no N+1 queries needed)
- Relationship input types: `parent_child`, `spouse`, `influencer`, `friend`, `colleague` — siblings/in-laws/grandparents are derived server-side
- Enriched constituent (`/group/constituents/{cid}`) includes `PermanentAddress` — no separate base constituent fetch needed
- Multi-constituency types: `["president", "mayor", "wdc_president"]` are global — always normalize with `type.toLowerCase().replace(/\s+/g, "_")` before comparing
- Voter add/import and party management are backend-only — no frontend CRUD for these
- 401 from API proxy redirects to /login — no manual error handling needed for auth failures