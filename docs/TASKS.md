# Tibia Data API — Task Board

> Visão completa de todas as entregas do projeto.
> Cada task possui seu próprio arquivo detalhado em `/docs/tasks/`.

---

## Epics

| # | Epic | Tasks |
|---|------|-------|
| E1 | Project Foundation | TASK-01, TASK-02, TASK-03, TASK-04 |
| E2 | Authentication & Users | TASK-05, TASK-06 |
| E3 | Core API Modules | TASK-07, TASK-08, TASK-09, TASK-10, TASK-11, TASK-12 |
| E4 | Collector Layer | TASK-13, TASK-14, TASK-15, TASK-16, TASK-17 |
| E5 | Discovery System | TASK-18 |
| E6 | Background Jobs | TASK-19, TASK-20, TASK-21, TASK-22, TASK-23 |
| E7 | Health & Security | TASK-24, TASK-25 |

---

## Task List

### E1 — Project Foundation

| ID | Title | Size | Status | Depends on |
|----|-------|------|--------|------------|
| [TASK-01](tasks/TASK-01.md) | Project Bootstrap | S | Done | — |
| [TASK-02](tasks/TASK-02.md) | Prisma Schema — All Tables | M | Done | TASK-01 |
| [TASK-03](tasks/TASK-03.md) | Global Config Module | S | Done | TASK-01 |
| [TASK-04](tasks/TASK-04.md) | Common Infrastructure | M | Done | TASK-01 |

### E2 — Authentication & Users

| ID | Title | Size | Status | Depends on |
|----|-------|------|--------|------------|
| [TASK-05](tasks/TASK-05.md) | Users Module | S | Done | TASK-02, TASK-03 |
| [TASK-06](tasks/TASK-06.md) | Auth Module (JWT) | M | Done | TASK-05 |

### E3 — Core API Modules

| ID | Title | Size | Status | Depends on |
|----|-------|------|--------|------------|
| [TASK-07](tasks/TASK-07.md) | Worlds Module — API Endpoints | S | Done | TASK-02, TASK-06 |
| [TASK-08](tasks/TASK-08.md) | Characters Module — List & Profile | M | Done | TASK-02, TASK-06 |
| [TASK-09](tasks/TASK-09.md) | Characters Module — Snapshots Endpoint | S | Done | TASK-08 |
| [TASK-10](tasks/TASK-10.md) | Characters Module — Daily XP Endpoint | S | Done | TASK-08 |
| [TASK-11](tasks/TASK-11.md) | Characters Module — Deaths Endpoint | S | Done | TASK-08 |
| [TASK-12](tasks/TASK-12.md) | Highscores Module — API Endpoints | S | Done | TASK-02, TASK-06 |

### E4 — Collector Layer

| ID | Title | Size | Status | Depends on |
|----|-------|------|--------|------------|
| [TASK-13](tasks/TASK-13.md) | Tibia HTTP Client Service | M | Done | TASK-03, TASK-04 |
| [TASK-14](tasks/TASK-14.md) | Rate Limit & Concurrency Service | S | Done | TASK-13 |
| [TASK-15](tasks/TASK-15.md) | Parser — Online World List | M | Done | TASK-13 |
| [TASK-16](tasks/TASK-16.md) | Parser — Highscores | M | Done | TASK-13 |
| [TASK-17](tasks/TASK-17.md) | Parser — Character Profile & Deaths | M | Done | TASK-13 |

### E5 — Discovery System

| ID | Title | Size | Status | Depends on |
|----|-------|------|--------|------------|
| [TASK-18](tasks/TASK-18.md) | Discovery Module & Reconciliation Service | M | Done | TASK-15, TASK-16, TASK-17 |

### E6 — Background Jobs

| ID | Title | Size | Status | Depends on |
|----|-------|------|--------|------------|
| [TASK-19](tasks/TASK-19.md) | Scheduler Setup & World Online Job | M | Done | TASK-15, TASK-18 |
| [TASK-20](tasks/TASK-20.md) | Highscores Sync Job | M | Todo | TASK-16, TASK-18 |
| [TASK-21](tasks/TASK-21.md) | Character Profile Refresh Job | M | Todo | TASK-17, TASK-18 |
| [TASK-22](tasks/TASK-22.md) | Daily Metrics Calculation Job | M | Todo | TASK-21 |
| [TASK-23](tasks/TASK-23.md) | Discovery Reconciliation Job | S | Todo | TASK-18, TASK-19, TASK-20 |

### E7 — Health & Security

| ID | Title | Size | Status | Depends on |
|----|-------|------|--------|------------|
| [TASK-24](tasks/TASK-24.md) | Health Endpoint | S | Todo | TASK-02 |
| [TASK-25](tasks/TASK-25.md) | Security Hardening | M | Todo | TASK-06, TASK-04 |

---

## Legenda

| Status | Descrição |
|--------|-----------|
| Todo | Não iniciado |
| In Progress | Em desenvolvimento |
| Review | Aguardando revisão |
| Done | Concluído |

| Size | Descrição |
|------|-----------|
| S | Small — entrega simples, poucos arquivos |
| M | Medium — envolve múltiplos arquivos ou lógica mais elaborada |
| L | Large — entrega complexa, múltiplas dependências |

---

## Fluxo de dependências resumido

```
TASK-01 (Bootstrap)
  ├── TASK-02 (Schema)
  ├── TASK-03 (Config)
  └── TASK-04 (Common)
        ├── TASK-05 (Users)
        │     └── TASK-06 (Auth)
        │           ├── TASK-07 (Worlds API)
        │           ├── TASK-08 (Characters API)
        │           │     ├── TASK-09 (Snapshots endpoint)
        │           │     ├── TASK-10 (Daily XP endpoint)
        │           │     └── TASK-11 (Deaths endpoint)
        │           └── TASK-12 (Highscores API)
        └── TASK-13 (HTTP Client)
              ├── TASK-14 (Rate Limit)
              ├── TASK-15 (Parser: Online)
              ├── TASK-16 (Parser: Highscores)
              └── TASK-17 (Parser: Character)
                    └── TASK-18 (Discovery)
                          ├── TASK-19 (Job: Online)
                          ├── TASK-20 (Job: Highscores)
                          ├── TASK-21 (Job: Profile Refresh)
                          │     └── TASK-22 (Job: Daily Metrics)
                          └── TASK-23 (Job: Reconciliation)

TASK-02 → TASK-24 (Health)
TASK-06 + TASK-04 → TASK-25 (Security)
```
