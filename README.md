# Calmpaper GraphQL API

The restored Calmpaper backend: GraphQL Yoga, Prisma ORM, and PostgreSQL. This
is the phase-one service described in
[`docs/rehabilitation-plan.md`](docs/rehabilitation-plan.md).

It supports email/password authentication, writers, books, pages, follows,
libraries, likes, comments/replies, and a database-backed Following feed.
GetStream, Stripe, Google OAuth, uploads, and transactional email remain
disabled for this phase.

## Local setup

Copy `.env.example` to `.env`, provide a PostgreSQL connection string, then:

```bash
bun install
bun run db:migrate
bun run db:seed
bun run dev
```

GraphQL is served at `http://localhost:4000/graphql`.

The idempotent seed creates six public-domain writers, six books, pages,
follows, library entries, and fictional cross-era discussions.

Demo account:

```text
demo@calmpaper.com
calmpaper
```

## Checks

```bash
bun run check
```

## Production

Required environment variables:

- `DATABASE_URL`
- `APP_SECRET`
- `FRONTEND_URL`

Apply migrations and seed the demo database before serving traffic:

```bash
bun run db:migrate
bun run db:seed
```

Vercel entry points live in `api/`; `/graphql` rewrites to `/api/graphql`.

## Security boundaries

- Mutation identity always comes from the signed bearer token.
- Password hashes and integration secrets are not exposed by GraphQL.
- Historical Google, Stream, Stripe, SendGrid, and upload code is not started.
- Previously committed keys must still be treated as compromised and rotated.
