# Calmpaper: next-session handoff

Last updated: 2026-07-23

This document is the durable handoff after phase 1. Read it together with
[`rehabilitation-plan.md`](./rehabilitation-plan.md). The two repositories are
still intentionally separate:

- frontend: `calmpaper_client`
- backend: `calmpaper_server`
- working branch in both: `agent/rehabilitate-demo`

## Non-negotiable product decisions

1. Preserve the original Calmpaper design, logo, typography, CSS, page
   structure, and component vocabulary. Do not redesign the product.
2. The Next.js frontend must use the real GraphQL backend. Do not replace it
   with static fixtures, REST demo endpoints, or browser-local business data.
3. Sample content belongs in a repeatable database seed.
4. The main Following feed is a PostgreSQL/GraphQL product feature. GetStream
   is optional infrastructure for notifications and related activity features;
   it must not become the source of truth for the main feed.
5. Stripe, Google OAuth, uploads, SendGrid, and GetStream remain disabled until
   their dedicated phases.
6. Frontend GraphQL operation names and behavior should stay stable while the
   backend is migrated to NestJS.

## Completed phase 1

### Backend

Commit: `1df8302 Restore GraphQL backend and seeded demo database`

- GraphQL Yoga 5 with an explicit schema and resolvers
- Prisma ORM 7 in Rust-free `engineType = "client"` mode
- PostgreSQL via `@prisma/adapter-pg`
- Email/password signup and login
- bcrypt password hashing and 30-day JWT bearer tokens
- Users, books, chapters, genres, follows, libraries, likes, comments/replies
- Database-backed Following feed
- Book and chapter publishing
- Production error masking and health endpoints
- Vercel-compatible handlers remain available under `api/`
- Initial migration in `prisma/migrations/`
- Idempotent literary sample seed in `prisma/seed.js`

Mutation identity is always derived from the verified JWT. Never reintroduce
client-provided acting user IDs.

### Frontend

Commit: `b6d2da2 Restore legacy frontend on real GraphQL data`

- Next.js 16 App Router and React 19
- Original Calmpaper logo, fonts, legacy CSS, and visual structure
- Server-rendered home, discovery, book, author, and feed routes
- Same-origin `/api/graphql` proxy for browser requests
- Persistent JWT session in local storage
- Real login, signup, follow, like, library, comment, book, and chapter flows
- Authenticated Following feed refresh
- No `sample-data.ts` or localStorage business-action mocks

### Seed and demo account

The seed creates six literary personas, six books, chapters, follows, library
entries, and fictional cross-era discussions.

```text
email: demo@calmpaper.com
password: calmpaper
persona: Mary Shelley
```

The conversations are sample fiction, not historical quotations.

### Phase-one stabilization follow-up

Frontend commit: `d4f1309 Restore chapter reader and polish legacy layouts`

Backend commit: `ab1d187 Expose chapters for restored reader`

- Added a real chapter GraphQL query and Next.js reader route.
- Made every table-of-contents row open its chapter.
- Added chapter likes, previous/next navigation, author details, and comments.
- Reused the original `page-read-book` visual vocabulary.
- Fixed the 180px book-cover wrapper and the book author sidebar.
- Restored the simpler legacy footer.
- Removed visible demo/sample/public-domain disclaimers.
- Generalized comments to support both books and chapters.
- Verified login → comment mutation → PostgreSQL → reload persistence.

## Current Sprite runtime

The complete phase-one stack is already running inside the current Sprite:

```text
calmpaper-postgres
  └── calmpaper-api
        └── calmpaper-web
```

Service details:

- `calmpaper-postgres`
  - embedded PostgreSQL 17
  - binds only to `127.0.0.1:5432`
  - data directory:
    `/home/sprite/calmpaper/.local-postgres/data`
- `calmpaper-api`
  - Bun process
  - `http://127.0.0.1:4000/graphql`
  - depends on `calmpaper-postgres`
- `calmpaper-web`
  - Next.js production server
  - `http://127.0.0.1:3000`
  - depends on `calmpaper-api`

The frontend `.env.local` points server-side and proxy traffic at the internal
GraphQL URL. PostgreSQL is not exposed over HTTP.

Checkpoint `v40` contains the verified reader, comment flow, service
configuration, and filesystem state.

### Publishing the Sprite URL

Only the frontend needs a public Sprite HTTP port. The browser talks to
`/api/graphql`; Next.js proxies that request internally to the GraphQL service.

The user authorized removing the unrelated `karaoke` service. `calmpaper-web`
now owns the Sprite HTTP route on port 3000. The remaining publishing step is
to change the Sprite URL auth setting from `sprite` to `public`.

While URL auth remains `sprite`, browser navigation works for an authenticated
Sprite owner, but client-side POST requests to `/api/graphql` may be redirected
to `sprites.dev/auth` and blocked by browser CORS. This is a platform auth-wall
effect, not an application GraphQL CORS failure.

The public URL must never expose environment variables, arbitrary files,
PostgreSQL, or a generic debug endpoint.

## Verified behavior

The following checks passed before this handoff:

```bash
# backend
bun run check

# frontend
bun ./node_modules/typescript/bin/tsc --noEmit
bun ./node_modules/eslint/bin/eslint.js .
bun ./node_modules/next/dist/bin/next build
```

Browser verification covered:

1. legacy homepage and navigation render without an error overlay;
2. seeded book, author, chapters, and comments load from GraphQL;
3. demo login creates a JWT session;
4. Following feed is filtered using database follows;
5. a book like persists across reload;
6. a comment is written to PostgreSQL and rendered immediately;
7. a new book and its first chapter can be published through the UI;
8. browser console had no captured errors.

## Important implementation paths

Backend:

- `src/schema.js` — GraphQL SDL and resolvers
- `src/auth.js` — password/JWT helpers and authorization boundary
- `src/prisma.js` — Prisma adapter and client lifecycle
- `src/app.js` — Yoga construction and request context
- `prisma/schema.prisma` — relational model
- `prisma/seed.js` — idempotent sample dataset
- `prisma/migrations/` — committed database migrations

Frontend:

- `src/lib/graphql.ts` — transport and GraphQL error handling
- `src/lib/calmpaper-api.ts` — server query functions
- `src/app/api/graphql/route.ts` — same-origin backend proxy
- `src/components/session-provider.tsx` — client JWT session
- `src/components/social-panel.tsx` — real comments and likes
- `src/components/feed-activity-list.tsx` — authenticated feed refresh
- `src/app/publish/` — book creation
- `src/app/books/[slug]/write/` — chapter publishing
- `src/assets/css/main.css` and `src/app/globals.css` — restored legacy styling

## Known boundaries and follow-up work

- Email verification, password reset, account recovery, rate limiting, content
  moderation, and abuse controls are not implemented.
- JWTs are stored in local storage to match the original bearer-token flow.
  Consider a same-origin HttpOnly cookie migration as a separate security
  change, not as incidental NestJS work.
- Seeded social counts include `legacyLikes`, `legacyReaders`, and
  `legacyFollowers` baselines plus real database actions.
- Uploaded media is still disabled. Do not expose the old local-file upload
  endpoint publicly.
- The first request after a cold Sprite wake should eventually gain an
  explicit readiness/retry path across Postgres → API → frontend.
- Add integration tests against a disposable PostgreSQL database before the
  NestJS migration begins.

## Phase 2: optional GetStream v2 restoration

Start only after phase 1 is publicly reachable and stable.

1. Confirm current server-side v2 compatibility and account availability.
2. Create a narrow `NotificationsProvider` interface in the backend.
3. Keep PostgreSQL as the product source of truth.
4. Emit notification activities after successful database transactions for
   follows, comments, replies, and likes.
5. Add an authenticated notifications query/view without changing the main
   Following feed.
6. Make Stream failures non-fatal to core mutations and add retry/logging.
7. Keep Stream secrets server-only and generate user tokens server-side.

Do not copy the old notification middleware wholesale. It coupled remote side
effects to GraphQL mutations without a durable retry boundary.

## Phase 3: migrate the backend to NestJS

The migration target should preserve the current GraphQL contract and database
schema. A recommended module boundary is:

```text
AppModule
├── PrismaModule
├── AuthModule
├── UsersModule
├── BooksModule
├── ChaptersModule
├── SocialModule
├── FeedModule
├── NotificationsModule
└── HealthModule
```

Suggested sequence:

1. Capture the current schema and representative operations as contract tests.
2. Scaffold NestJS in the backend repository on a new migration branch.
3. Move Prisma client lifecycle into `PrismaModule`.
4. Implement JWT strategy/guard and a `CurrentUser` decorator.
5. Port read-only queries module by module.
6. Port mutations while keeping authorization checks explicit in services.
7. Run old and new backends against disposable databases with the same seed.
8. Point the unchanged frontend proxy at NestJS and rerun browser verification.
9. Remove Yoga only after contract and end-to-end parity passes.

Prefer thin resolvers and service-level authorization. Do not expose generated
Prisma CRUD directly through GraphQL.

The Sprite topology does not need to change: replace the command behind
`calmpaper-api`, keep port 4000 and `/graphql`, and leave the frontend proxy
unchanged.

## Phase 4: migrate GetStream v2 to v3

Treat this as an integration migration, not a product rewrite.

1. Inventory every v2 feed group, activity type, user token, and notification
   rendering dependency.
2. Map only still-used notification semantics to v3.
3. Put v2 and v3 behind the same `NotificationsProvider` interface.
4. Dual-write in a controlled environment if account support allows it.
5. Backfill only data required by the demo/product.
6. Switch reads, compare results, then remove v2 credentials and code.

Re-evaluate GetStream before this phase. If database notifications plus a
small queue are sufficient, do not migrate merely to preserve an unused
vendor dependency.

## Next-session opening checklist

1. Read this file and `rehabilitation-plan.md`.
2. Run `git status` in both repositories; preserve unrelated user changes.
3. Confirm services with `sprite-env services list`.
4. Confirm health:

   ```bash
   curl http://127.0.0.1:4000/graphql \
     -H 'content-type: application/json' \
     --data '{"query":"{ health }"}'
   curl -I http://127.0.0.1:3000
   ```

5. Run the seed only when an idempotent sample-data refresh is intended.
6. Create a checkpoint before changing runtime services or beginning a major
   migration.
7. Work on a new branch for each later phase and commit/push the two
   repositories separately.
