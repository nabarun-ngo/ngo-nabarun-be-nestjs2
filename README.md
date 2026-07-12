# nestjs-consumer-app

A NestJS application that consumes [`nestjs-shared`](../nestjs-shared-main) as a local library dependency.  
It demonstrates the full DDD four-layer pattern (Domain → Application → Infrastructure → Presentation) alongside all major shared modules.

---

## Architecture

```
src/
└── notes/                          ← Example bounded context (Notes)
    ├── domain/
    │   ├── aggregates/             ← Note aggregate root (AggregateRoot<string>)
    │   ├── errors/                 ← NoteNotFoundError, NoteTitleRequiredError (extend BusinessError)
    │   └── repositories/           ← INoteRepository interface + NoteFilter
    ├── application/
    │   ├── commands/create-note/   ← CreateNoteCommand + CreateNoteHandler
    │   └── queries/                ← GetNoteQuery, ListNotesQuery + handlers
    ├── infrastructure/
    │   └── persistence/            ← NoteRepository (extends PrismaCrudRepositoryBase)
    └── presentation/
        ├── controllers/            ← NotesController (REST)
        └── dtos/                   ← CreateNoteDto, NoteResponseDto
```

## Shared modules consumed

| Module | Purpose |
|---|---|
| `nestjs-shared/core` | `AggregateRoot`, `BaseDomain`, `BusinessError`, `bootstrapApp`, `CoreModule` |
| `nestjs-shared/database` | `DatabaseModule`, `BasePrismaService`, `PrismaCrudRepositoryBase`, `CacheService`, Redis |
| `nestjs-shared/auth` | `AuthModule`, `UnifiedAuthGuard`, `@CurrentUser()`, `@RequirePermissions()`, `@Public()` |
| `nestjs-shared/observability` | `ObservabilityModule` — Slack alerts for `AppTechnicalError` |

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | >= 20 |
| npm | >= 10 |
| PostgreSQL | >= 15 |
| Redis | >= 7 |

---

## One-time setup

### 1. Install dependencies

```bash
cd nestjs-consumer-app
npm install
```

`npm install` triggers the `nestjs-shared` **postinstall hook**, which copies the shared Prisma model fragments into `prisma/models/shared/`.  
If the hook is skipped (e.g. in CI with `--ignore-scripts`), run it manually:

```bash
npm run sync-schema
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_JWKS_URI` | Auth0 JWKS endpoint |
| `JWT_ISSUER` | Auth0 issuer URL |
| `JWT_AUDIENCE` | API audience identifier |

### 3. Generate the Prisma client

```bash
npm run generate:db
```

This runs `prisma generate`, which reads all `.prisma` files under `prisma/models/` (including the shared fragments in `prisma/models/shared/`) and emits the typed client to `generated/prisma/`.

### 4. Run database migrations

```bash
# Development — creates migration files and applies them
npm run migrate:dev

# Production / CI — applies existing migration files only
npm run migrate:deploy
```

---

## Running the app

```bash
# Development (watch mode)
npm run start:dev

# Production build + start
npm run build
npm start
```

The API is available at `http://localhost:3000/api`.  
Swagger UI (non-production only) is at `http://localhost:3000/api/docs`.

---

## API endpoints

### Notes

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/notes` | Bearer (requires `notes:write` permission) | Create a note |
| `GET` | `/api/notes` | Public | List notes (paged) |
| `GET` | `/api/notes/:id` | Public | Get a single note |

#### Create note request body

```json
{
  "title": "My first note",
  "content": "Note body content here…"
}
```

#### Query parameters for list

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `0` | Zero-based page index |
| `pageSize` | number | `20` | Items per page |
| `authorId` | string | — | Filter by author |

---

## Adding a new bounded context

Follow the DDD checklist from the workspace rules:

1. Create `src/<module>/domain/aggregates/<name>.aggregate.ts` — extend `AggregateRoot<string>` from `nestjs-shared/core`.
2. Add domain errors in `domain/errors/` — extend `BusinessError`.
3. Define the repository interface in `domain/repositories/` — extend `IRepository<T, ID, Filter>`.
4. Write CQRS handlers in `application/commands/` and `application/queries/`.
5. Implement the Prisma repository in `infrastructure/persistence/` — extend `PrismaCrudRepositoryBase`.
6. Add a controller + DTOs in `presentation/`.
7. Wire everything in `<module>.module.ts` — provide the repository using its `Symbol` token.
8. Import the module in `AppModule`.

---

## Upgrading nestjs-shared

```bash
# Update the dependency
npm install nestjs-shared@latest

# Re-sync Prisma shared model fragments
npm run sync-schema

# Regenerate the client and create a migration
npm run generate:db
npm run migrate:dev -- --name sync_nestjs_shared
```
