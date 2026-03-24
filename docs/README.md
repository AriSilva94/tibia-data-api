# MASTER PROMPT — Tibia Data API with NestJS
## Projeto: API própria para coleta e exposição de dados do Tibia
## Escopo inicial: mundo Calmera
## Objetivo futuro: escalar para múltiplos mundos
## Formato: documento único em Markdown
## Idioma do projeto: English for code/comments, Portuguese for business context is allowed
## Stack principal: NestJS + TypeScript + Prisma + SQLite
## Estilo de execução: incremental, modular, production-minded, cost-zero first

---

# 1. Project Purpose

We want to build our own **private API** in **NestJS** to collect, store, process, and expose relevant public data from the MMORPG **Tibia**, without relying on third-party APIs.

The initial focus is **only the world Calmera**, but the architecture must be prepared from day one to scale to additional worlds in the future.

This API will be consumed by a separate front-end project.

The API must be:
- private
- authenticated
- modular
- resilient
- cheap to run
- initially deployable with **zero cost**
- designed around **historical data ownership**

The real value of the project is **not scraping itself**, but building our own **historical database** of Tibia world/player activity that can power features such as:
- online player tracking
- daily XP comparison
- character profile lookup
- deaths tracking
- world activity feeds
- enemy/friend monitoring
- future ranking, analytics, and comparison dashboards

---

# 2. Main Product Vision

We want a backend capable of powering features such as:

- list all tracked worlds
- list currently online players for a world
- track Calmera online activity over time
- discover and index characters from Calmera
- calculate daily XP gain for all indexed characters
- collect and store recent character deaths
- provide character-centric endpoints
- provide world-centric endpoints
- compare players in the future
- support future expansion to all Tibia servers

Even though we start with **Calmera only**, the implementation must be **multi-world ready**.

---

# 3. Critical Constraints

## 3.1 Financial constraints
We do **not want to spend money now**.

This means:
- no paid APIs
- no paid crawling services
- no paid queue infrastructure
- no paid database
- no mandatory paid hosting
- cost-zero first approach

## 3.2 Data source constraints
We do **not** want to consume a third-party Tibia API as our main source.

The source of truth must be the **public HTML pages** of Tibia-related public pages.

## 3.3 Technical constraint: Cloudflare / anti-bot
There may be anti-bot or challenge-based protection in front of some public pages.

The implementation **must not assume that every request will always succeed**.

The architecture must therefore be based on:
- scheduled collection
- retries with backoff
- stale-safe data serving
- database snapshots
- resilience to temporary blocking/challenges

The system must **never depend on live scraping during a front-end request**.

## 3.4 Security constraint
The API must be protected.

Only authenticated consumers can access private endpoints.

Without valid credentials, the API must respond with:
- `401 Unauthorized`

---

# 4. High-Level Strategy

The correct architecture is **not** "front-end requests a route, backend scrapes Tibia live and returns data".

The correct architecture is:

1. background jobs collect data from public Tibia pages
2. parsed data is normalized and stored locally
3. historical snapshots are kept
4. the API serves data from the local database only
5. if collection fails temporarily, the API still works using the latest available snapshot

This makes the project:
- more resilient
- cheaper
- safer
- more scalable
- Cloudflare-tolerant
- front-end friendly

---

# 5. Initial Scope: Calmera

The first production scope is:

- only world **Calmera**
- discover as many Calmera characters as possible
- maintain a growing master index of Calmera characters
- ensure at least one daily snapshot for all confirmed Calmera characters
- calculate daily XP from snapshots
- collect recent deaths when profiles are refreshed
- expose authenticated API endpoints for consumption

Important: there is no guarantee that a single public page exists containing all Calmera characters in one place.

Therefore, the system must build its own **master index of characters** using multiple public sources.

---

# 6. Character Discovery Strategy

We must discover Calmera characters through multiple sources.

## 6.1 Online world pages
Use the world online list to discover characters that are online at collection time.

## 6.2 Highscores
Use highscores pages to discover ranked characters.

## 6.3 Guild pages
Use guild pages and member listings to discover additional characters.

## 6.4 Character profile pages
Use individual profile pages to confirm world, enrich profile information, and collect deaths.

## 6.5 User-driven lookup
If, in the future, the front-end requests a character not yet indexed, the system may try to resolve that character and permanently add it if it belongs to Calmera.

---

# 7. Functional Requirements

The system must support the following capabilities.

## 7.1 Authentication
- login endpoint
- JWT-based authentication
- protected routes
- 401 on missing or invalid token

## 7.2 Worlds
- list tracked worlds
- retrieve world information
- retrieve latest online players snapshot for Calmera

## 7.3 Characters
- list characters
- retrieve character profile
- retrieve character snapshots
- retrieve character daily XP
- retrieve character deaths
- retrieve online presence information if available

## 7.4 Background jobs
- online list synchronization
- highscores synchronization
- character profile refresh
- daily metrics calculation
- discovery reconciliation

## 7.5 Historical persistence
- snapshot storage
- derived daily metrics
- deduplicated deaths
- online world snapshots

---

# 8. Non-Functional Requirements

The project must be:

- modular
- maintainable
- easy to extend
- strongly typed
- incremental
- observable with logs
- safe against temporary source failures
- suitable for local zero-cost execution
- ready for future PostgreSQL migration
- ready for future multi-world scaling

---

# 9. Recommended Stack

## Backend Framework
- NestJS

## Language
- TypeScript

## Database (initial)
- SQLite

## Future Database
- PostgreSQL

## ORM
- Prisma

## Scheduling
- `@nestjs/schedule`

## HTML Parsing
- Cheerio

## Validation
- `class-validator`
- `class-transformer`

## Authentication
- `@nestjs/jwt`
- `passport-jwt`
- `bcrypt`

## Concurrency control
- `p-limit`

## Date utilities
- `dayjs` or `date-fns`

---

# 10. Architecture Principles

## 10.1 Multi-world ready from day one
Even though only Calmera is enabled initially, the codebase must never hardcode business rules around a single world.

Every important domain structure must include `world`.

## 10.2 No live scraping during API reads
All public/private consumer endpoints must read from the local database.

## 10.3 Scraping is asynchronous
Scraping must happen in scheduled jobs, not in request/response flow.

## 10.4 Parser isolation
HTML parsing logic must be isolated from controllers and domain services.

## 10.5 Security first
All sensitive routes must be protected by guards.

## 10.6 Graceful degradation
If data collection fails, API reads must still work using latest stored data, along with freshness metadata.

---

# 11. Cloudflare / Anti-Bot Handling Strategy

This project must **not** depend on bypassing interactive anti-bot challenges.

Instead, the collection layer must be designed to be resilient.

## 11.1 Core idea
We are not trying to "beat" anti-bot in real-time.

We are building a system that:
- collects when possible
- slows down on challenge or block
- retries later
- stores successful snapshots
- keeps the API usable even with temporarily stale data

## 11.2 Required behaviors
The collector must classify outcomes such as:
- success
- timeout
- network error
- parse error
- challenge suspected
- temporary block suspected

## 11.3 Backoff policy
When challenge/block is suspected:
- reduce concurrency
- increase delay
- stop hammering the same route
- retry later with a conservative strategy

## 11.4 Stale-safe API
All responses that depend on collected data should ideally include metadata such as:
- `lastCollectedAt`
- `isStale`

## 11.5 Optional fallback
If needed in the future, a local browser fallback (e.g. Playwright running on the developer machine) may be added **only as a fallback for specific routes**, not as the default strategy for the entire platform.

---

# 12. Data Model Overview

## 12.1 users
Stores API users.

Suggested fields:
- id
- email
- passwordHash
- role
- isActive
- createdAt
- updatedAt

## 12.2 worlds
Stores trackable worlds.

Suggested fields:
- id
- name
- region
- pvpType
- creationDate
- isTracked
- lastOnlineCount
- createdAt
- updatedAt

## 12.3 characters
Master index of discovered characters.

Suggested fields:
- id
- name
- world
- isConfirmedWorld
- discoverySource
- firstSeenAt
- lastSeenAt
- lastSeenOnlineAt
- lastProfileScanAt
- isActiveCandidate
- createdAt
- updatedAt

## 12.4 character_profiles
Latest consolidated profile state.

Suggested fields:
- id
- characterId
- world
- level
- experience
- vocation
- guildName
- residence
- sex
- formerNamesRaw
- accountStatusRaw
- lastFetchedAt

## 12.5 character_snapshots
Historical snapshots.

Suggested fields:
- id
- characterId
- world
- collectedAt
- level
- experience
- vocation
- guildName
- statusOnline
- sourceType

## 12.6 character_daily_metrics
Derived daily metrics.

Suggested fields:
- id
- characterId
- world
- date
- expStart
- expEnd
- expGained
- levelStart
- levelEnd
- levelsGained
- deathsCount
- updatedAt

## 12.7 character_deaths
Deaths history.

Suggested fields:
- id
- characterId
- world
- deathAt
- level
- killersRaw
- dedupeHash
- collectedAt

## 12.8 online_world_snapshots
World online snapshots.

Suggested fields:
- id
- world
- collectedAt
- onlineCount

## 12.9 online_players_snapshots
Players online at a specific world snapshot.

Suggested fields:
- id
- world
- collectedAt
- characterName
- level
- vocation

## 12.10 highscores_snapshots
Highscores entries.

Suggested fields:
- id
- world
- category
- page
- rank
- characterName
- vocation
- value
- collectedAt

## 12.11 discovery_edges
Optional discovery lineage.

Suggested fields:
- id
- world
- sourceType
- sourceKey
- characterName
- createdAt

---

# 13. Daily XP Calculation Strategy

Daily XP is not directly available as a ready-made field from public character data.

It must be derived from historical snapshots.

## Rule
For each confirmed Calmera character:
- collect at least one useful snapshot per day
- compare the current day snapshot against another relevant snapshot
- compute experience delta

## Formula
`expGained = expEnd - expStart`

## Minimum requirement
Every confirmed Calmera character must have at least:
- one daily snapshot policy

Without snapshots, there is no reliable daily XP tracking.

---

# 14. Online Status Strategy

Online status is inferred from world online snapshots.

## Rules
- if a character appears in a world online snapshot, the character is online at that instant
- if a character appeared before and disappears in a later snapshot, offline transition may be inferred
- `lastSeenOnlineAt` should be updated whenever a character appears online

---

# 15. Security Model

## 15.1 Authentication model
Use JWT Bearer authentication.

## 15.2 Required endpoints
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

## 15.3 Route protection
Protected endpoints must require valid JWT.

Without valid credentials:
- return `401 Unauthorized`

## 15.4 Password handling
- store password with bcrypt hash
- never store plaintext password

## 15.5 Basic roles
For MVP:
- `admin`

Possible future roles:
- `client`
- `internal`
- `admin`

## 15.6 Additional security recommendations
- CORS restriction
- request validation
- global exception filter
- versioned API prefix
- rate limit on auth endpoints
- structured logging

---

# 16. Suggested Folder Structure

```txt
src/
  main.ts
  app.module.ts

  common/
    constants/
    decorators/
    dto/
    enums/
    filters/
    guards/
    interceptors/
    pipes/
    utils/

  config/
    app.config.ts
    auth.config.ts
    database.config.ts
    schedule.config.ts

  modules/
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      dto/
      strategies/
      guards/

    users/
      users.module.ts
      users.service.ts
      users.controller.ts
      dto/

    worlds/
      worlds.module.ts
      worlds.controller.ts
      worlds.service.ts
      dto/

    characters/
      characters.module.ts
      characters.controller.ts
      characters.service.ts
      dto/

    snapshots/
      snapshots.module.ts
      snapshots.service.ts
      snapshots.controller.ts

    deaths/
      deaths.module.ts
      deaths.service.ts
      deaths.controller.ts

    highscores/
      highscores.module.ts
      highscores.service.ts
      highscores.controller.ts

    discovery/
      discovery.module.ts
      discovery.service.ts

    collector/
      collector.module.ts
      services/
        tibia-http-client.service.ts
        tibia-cache.service.ts
        tibia-rate-limit.service.ts
      parsers/
        world.parser.ts
        online.parser.ts
        highscores.parser.ts
        character.parser.ts

    scheduler/
      scheduler.module.ts
      scheduler.service.ts
      jobs/
        world-online.job.ts
        highscores-sync.job.ts
        character-refresh.job.ts
        daily-metrics.job.ts
        discovery-reconciliation.job.ts

    health/
      health.module.ts
      health.controller.ts

  prisma/
    prisma.module.ts
    prisma.service.ts