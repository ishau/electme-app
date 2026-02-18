# ElectMe App

## Tech Stack
- Next.js app router with `(app)` route group — pages are client-side, auth/proxy via API routes (SSR)
- Go backend API — all response fields are PascalCase (e.g., `CandidateType`, `IsOwnCandidate`)
- TanStack Query for data fetching (`useQuery`) and cache invalidation after mutations (`queryClient.invalidateQueries`)
- UI: shadcn/ui (base-nova style, Base UI primitives) in `/components/ui` — DO NOT modify these files, fix consumers instead
- Font: Public Sans (sans), Geist Mono (mono)
- Charts: Recharts (`recharts`) for bar charts, pie charts, etc. CSS heatmaps for calendar grids.
- nuqs for URL search param state in filter components (`useQueryStates`, `parseAsString`)
- Auth: HttpOnly cookie session, Next.js API routes for login/logout, catch-all proxy for Go backend

## Key Files
- `/lib/types.ts` — all TypeScript interfaces for API responses
- `/lib/auth.ts` — auth utilities (login, logout, fetchUser) — all call Next.js API routes
- `/lib/api.ts` — API client (`get`, `post`, `put`, `del`) — calls `/api/backend/*` proxy (same-origin)
- `/lib/hooks/use-auth.ts` — `useAuth()` hook for current user info (calls `/api/auth/me`)
- `/lib/hooks/` — TanStack Query hooks for all data fetching (useGroup, useConstituents, useCandidateVoters, etc.)
- `/lib/hooks/use-demographics.ts` — demographics data hook
- `/lib/hooks/use-analytics.ts` — analytics hooks (support trend, outreach by day, team activity, support by constituency)
- `/lib/mutations.ts` — all mutation functions
- `/lib/hooks/use-houses.ts` — house listing hook with pagination support
- `h3-js` — H3 cell boundary rendering for base-plotted houses on maps
- `/app/api/auth/` — login (POST), logout (POST), me (GET) — server-side, manages HttpOnly cookie
- `/app/api/backend/[...path]/route.ts` — catch-all proxy: reads cookie, forwards to Go with Authorization header
- `/components/auth-guard.tsx` — uses `useAuth()`, redirects to /login if not authenticated
- `/components/providers.tsx` — QueryClientProvider + TooltipProvider
- `/components/layout/app-layout-content.tsx` — client component for layout data fetching
- `/components/shared/gender-badge.tsx` — `GenderBadge` component: blue for male, pink for female — use everywhere gender is displayed
- `/lib/hooks/use-hex.ts` — hex analytics hooks (`useHexLeaning`, `useHexPartySupport`, `useHexCandidateSupport`) — no `useHexDominant` (removed)
- `/components/settings/geography-view.tsx` — `HouseManagementView` component (used in maps/houses tab, NOT settings)

## Architecture
- All pages are `"use client"` — data fetched via hooks, mutations via `lib/mutations.ts`
- **Auth flow**: Login form → `POST /api/auth/login` (Next.js API route) → proxies to Go backend → sets HttpOnly `session` cookie with JWT → returns user info. Logout via `POST /api/auth/logout` (clears cookie).
- **API proxy**: All client API calls go to `/api/backend/*` (same-origin). The catch-all route reads the HttpOnly cookie and forwards to Go backend with `Authorization: Bearer` header. Client JS never sees the JWT.
- **Security**: HttpOnly cookie (XSS-immune), SameSite=Lax (CSRF protection), Secure in production.
- Group-scoped API routes use `/group/...` (singular, group from JWT). Unprotected routes (geography, parties, base constituents) use original paths.
- `AuthGuard` in `app/(app)/layout.tsx` uses `useAuth()` hook to check session. Login page at `app/login/page.tsx`.
- Reference data hooks (atolls, islands, parties, constituencies) use `staleTime: Infinity` — fetched once per session
- `AssessedBy`/`ContactedBy` are server-set from JWT — campaign forms should NOT include these fields
- `useLatestSupport` returns `Record<string, SupportAssessment[]>` (full history per person) — household card and support card group assessments by candidate type (mayor/president/wdc/etc), show latest prominently with compact history below
- `keepPreviousData` on filter-dependent hooks to prevent "No results" flash during refetch
- Layout split: `app/(app)/layout.tsx` (server component with `<Suspense>` + `<NuqsAdapter>`) wraps `AuthGuard` > `AppLayoutContent` (client component)
- Loading skeletons: use `PageSkeleton`/`TableSkeleton` from `components/shared/loading-skeleton.tsx` gated on `isLoading`
- `Page` component `description` accepts `ReactNode` — can render styled badges/tooltips inline in page headers
- Party affiliation display: colored left border (`border-l-4`) on list items (e.g., household card), or colored dots next to names in tables — resolved from `LatestAffiliation.PartyID` against `parties` array
- Gender display: always use `<GenderBadge sex={...} />` from `components/shared/gender-badge.tsx` — blue for M, pink for F
- **Tab layouts**: Dashboard (`/dashboard/*`) and Maps (`/maps/*`) use tab subpages with `layout.tsx` containing tab links. Pattern: parent `page.tsx` does `redirect()` to default tab. Maps default tab is `/maps/leaning`.
- **Dashboard tabs**: Overview, Demographics, Campaign, Outreach, Election Day — each loads only its own data

## Environment Variables
- `BACKEND_URL` — Go backend URL (server-only, default: `http://localhost:8080/api/v1`)
- No `NEXT_PUBLIC_*` env vars needed — client calls same-origin proxy

## Commands
- `npm run build` — build (uses Turbopack)
- `npm run dev` — dev server

## Gotchas
- Go backend returns PascalCase keys in ALL responses including login (`Token`, `GroupID`, `ExpiresAt`) — API route handlers in `app/api/` must use PascalCase when reading backend responses (e.g., `data.Token` not `data.token`)
- Go backend omits zero-value fields (empty strings, nil, 0) — use `?` optional markers on TypeScript interfaces, not just `| null`
- `useSearchParams()`/nuqs requires a `<Suspense>` boundary — the layout handles this, don't make `layout.tsx` a client component
- API enum/type values (e.g., `CandidateType`) use inconsistent casing — can be `"Mayor"`, `"WDC President"`, or `"council_member"`. Always normalize (lowercase + replace spaces with underscores) before comparing.
- `/group/constituents` returns `PaginatedResponse<T>` (`{ data, total, limit, offset }`), not a plain array
- `/group/constituents` supports optional `constituency_id` param — omit it to fetch across all constituencies
- Age is server-calculated (integer, nullable) — no client-side DOB conversion needed
- `PermanentAddress` includes `IslandName` — display as "Address / IslandName"
- `ContactInfo` has only `PhoneNumbers` and `Email` (no MobileNumbers/Viber) — Email is not editable in the profile form
- Profile form (`ProfileForm`) displays all voter info seamlessly in one list — no "No profile data" empty state, no separator between base and enriched data
- `ConstituentSearchResult.PermanentAddress` is a plain string (not the nested object)
- Relationships use `RelationshipView` — API returns `PersonID`, `Name`, `Address`, `RelLabel`, `Derived`, `Score` (no N+1 queries needed)
- Relationship input types: `parent_child`, `spouse`, `influencer`, `friend`, `colleague` — siblings/in-laws/grandparents are derived server-side
- Enriched constituent (`/group/constituents/{cid}`) includes `PermanentAddress` — no separate base constituent fetch needed
- List/search constituents and `RelationshipView` include `LatestAffiliation?: PartyAffiliation` (single pre-resolved object, not an array)
- Multi-constituency types: `["president", "mayor", "wdc_president"]` are global — always normalize with `type.toLowerCase().replace(/\s+/g, "_")` before comparing
- Voter add/import and party management are backend-only — no frontend CRUD for these
- 401 from API proxy redirects to /login — no manual error handling needed for auth failures
- Recharts `Tooltip` formatter: use `(value: any)` with `// eslint-disable-next-line @typescript-eslint/no-explicit-any` — Recharts `ValueType` is a union type that doesn't accept plain `number`
- Recharts `Pie` label: `percent` prop is possibly undefined — always use `(percent ?? 0)`
- `/group/houses` returns `PaginatedResponse<House>` with `constituency_id`, `search`, `plotted` filters
- House `H3Cell` (string|null) = base-plotted approximate area. `Lat`/`Lng` = group-plotted exact coords. Both null = unplotted.
- maplibre-gl: hex-map-inner uses top-level import (dynamic parent handles SSR). Plot map in geography-view uses `import("maplibre-gl")` dynamic import.
- MapLibre popup default `maxWidth` is 240px — set `maxWidth: "360px"` when creating popups with wider content. Popup HTML uses inline styles (no Tailwind). Override `.maplibregl-popup-close-button` and `.maplibregl-popup-content` via `<style>` tag in component.
- When merging branches where main is ahead, prefer HEAD versions for types/hooks/mutations and accept only genuinely new files from the feature branch. Check for renamed functions (e.g., `plotHouse` vs `updateHouseLocation`) and type field mismatches (e.g., `IsPlotted` vs `HasOverride`).
- Google Satellite tiles: `https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}` — zoom 20+, good for Maldives house-level work
- shadcn uses Base UI (not Radix) — `asChild` prop doesn't exist, use `render` prop for element polymorphism (e.g., `<DialogTrigger render={<Button />}>`)
- Base UI Select `onValueChange` signature is `(value: string | null, eventDetails) => void` — wrap setState: `onValueChange={(v) => setState(v ?? "")}`
- Base UI Select `SelectValue` shows raw value by default — must pass `items` prop to `<Select>` mapping values to labels (e.g., `items={{ foo: "Foo Label" }}`)
- CSS custom properties: `--radix-*` vars don't exist — use `--anchor-width`, `--transform-origin`, `--available-height`