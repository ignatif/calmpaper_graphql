# Calmpaper rehabilitation plan

This document is shared by the client and server repositories. It records the
agreed recovery path so that each milestone leaves Calmpaper in a deployable,
testable state.

## Product constraints

- Preserve the original Calmpaper interface, visual language, routes, and
  component structure. The Next.js migration is not a redesign.
- Keep the backend as a real part of the product. Demo data must be database
  seed data, not a static replacement for the API.
- Keep GraphQL as the primary client/server contract.
- Keep PostgreSQL as the source of truth for users, books, chapters, follows,
  comments, replies, likes, reviews, and feed membership.
- Disable Stripe/donations and Google OAuth until their production flows are
  intentionally restored.
- Use email/password authentication for the first public demo.
- Make every seed and external backfill idempotent.

## Target architecture

```text
Next.js client
      |
      | GraphQL
      v
Application backend
      |
      +-- PostgreSQL / Prisma
      |     +-- users and authentication
      |     +-- books and chapters
      |     +-- comments and replies
      |     +-- likes and follows
      |     +-- following feed query
      |     +-- notification outbox
      |
      +-- GetStream (later milestones)
            +-- notification aggregation
            +-- seen/unread state
            +-- realtime delivery
```

Canonical product data remains in PostgreSQL. GetStream is an optional delivery
and aggregation layer, never a second source of truth.

## Phase 1 — restore and deploy the product without GetStream

### Client

- Run Next.js with the App Router.
- Port the original React components and legacy CSS/SCSS with the smallest
  compatibility changes necessary for Next.js.
- Preserve the original header, catalog, book cards, book page, reader page,
  profile, feed, registration, and login designs.
- Replace `react-router-dom` with Next.js routing without changing the visible
  information architecture.
- Replace direct legacy `urql` usage with a small typed GraphQL data layer.
- Hide the notification bell until notifications are functional.
- Hide Google sign-in, Stripe, and donations.

### Server

- Restore the original GraphQL/Prisma behavior as the reference implementation.
- Use PostgreSQL and an explicit migration.
- Support books, chapters, users, email/password auth, comments, replies, likes,
  follows, reviews, and the database-backed following feed.
- Keep the old GraphQL operation names where practical, but do not preserve
  unsafe generic CRUD merely for compatibility.
- Add a health endpoint and deployment-safe configuration.
- Do not restore GetStream in this phase.

### Required security work

- Apply authorization to protected operations.
- Derive the acting user from a verified JWT, never from a client-supplied
  `userId`, `authorId`, or `followerId`.
- Do not expose password hashes, OAuth identifiers, Stripe identifiers, secrets,
  or another user's Stream token through GraphQL.
- Remove broad generated delete/update operations from the public schema.
- Validate environment variables and GraphQL inputs.
- Restrict CORS to configured frontend origins.
- Avoid local persistent file storage in deployed/serverless runtimes.

### Seed

The idempotent database seed should include:

- public-domain authors and books;
- sample chapters and preview text;
- demo email/password accounts;
- follows and favorite books;
- comments and nested replies;
- likes, reviews, genres, and tags.

The playful cross-era author conversations are demo fiction and should be
clearly identified as such.

### Exit criteria

- Registration and login survive a reload.
- Catalog, book, chapter, author, and profile pages read from GraphQL.
- Publishing, following, liking, commenting, and replying persist in PostgreSQL.
- The Following feed is built from database relations through GraphQL.
- Client and server have automated checks and production health checks.
- Both repositories are pushed and production deployments are reachable.

## Phase 2 — restore GetStream v2 if the existing app is usable

This phase is conditional. Before starting, confirm that the original Stream
application, credentials, region, and feed groups are still accessible.

- Keep the main Following feed in PostgreSQL/GraphQL.
- Restore only notification delivery and aggregation.
- Issue Stream tokens only for the authenticated current user.
- Support follow, comment, reply, like, review, new-book, and new-chapter
  notification events.
- Add seen/unread state, pagination, and realtime UI updates.
- Await and observe external writes; remove duplicate activity creation.
- Do not copy the legacy pattern where a notification feed attempts to follow
  book/user feeds. Publish explicit recipient notifications instead.

Introduce a provider boundary before wiring Stream:

```ts
interface ActivityFeedProvider {
  createUserToken(userId: string): string
  publishNotification(input: NotificationInput): Promise<void>
  removeNotification(id: string): Promise<void>
}
```

The initial implementation is `GetStreamV2Provider`.

If the existing v2 application cannot be used, skip this phase and keep
notifications disabled until Phase 4.

## Phase 3 — migrate the backend to NestJS

- Snapshot the working GraphQL schema and all frontend operations.
- Add GraphQL contract tests before changing the implementation.
- Upgrade Prisma and preserve the PostgreSQL data model with explicit
  migrations.
- Use NestJS, TypeScript, Apollo, and schema-first GraphQL for the initial port.
- Split the backend into Prisma, Auth, Users, Books, Chapters, Comments,
  Reactions, Feed, Notifications, Uploads, Polls, and optional Payments modules.
- Move business logic into services and keep resolvers thin.
- Use GraphQL JWT guards and a current-user decorator.
- Emit domain events after successful writes.
- Keep GetStream behind `ActivityFeedProvider`; the frontend should not change
  when the backend implementation moves to NestJS.
- Run the old and new GraphQL endpoints side by side until contract and E2E
  tests agree, then switch the client.

## Phase 4 — migrate GetStream v2 to v3

- Replace the server adapter with `GetStreamV3Provider`.
- Replace the client v2 SDK/provider with the v3 feeds client.
- Configure v3 users, feeds, notification aggregation, permissions, and
  realtime watch behavior.
- Keep PostgreSQL as the canonical store and send deterministic entity IDs to
  Stream.
- Seed a database outbox and replay it to produce idempotent sample
  notifications.

For a demo dataset, prefer creating a fresh v3 app and rebuilding activities
from PostgreSQL. Use Stream's v2-to-v3 live replication only if valuable
non-demo v2 history exists by then.

## Deployment checkpoints

Each phase must be delivered as:

1. focused commits in both repositories;
2. pushed feature branches and updated pull requests;
3. passing type, lint, unit, integration, and browser smoke checks appropriate
   to that phase;
4. a documented database migration/seed command;
5. a verified frontend URL, backend health URL, and GraphQL endpoint;
6. a Sprite checkpoint after the verified deployment.

## Current decision

Proceed with Phase 1. Do not implement GetStream, Stripe, donations, or Google
OAuth as part of this milestone.
