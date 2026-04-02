# Agent Guidelines for ARServerController

This document provides clear instructions for AI coding agents (Cursor, Copilot, Claude, etc.) working on **ARServerController** — a lightweight, self-hosted dashboard for managing a small number of Arma Reforger dedicated servers in Docker containers.

## Project Overview

ARServerController is a minimal web dashboard to create, start, stop, and monitor Arma Reforger dedicated servers running inside Docker containers.
It targets **small private groups** (typically 3–20 servers) and is explicitly **not** designed for large-scale or public use.

**Core priorities:**
- Working code and developer productivity over perfect architecture
- Developed and maintained by a single developer
- Keep everything simple, readable, and fast to iterate on
- Focus on real usability for private Arma Reforger communities

Current main features:
- FastAPI backend with SQLite + SQLAlchemy
- Vue 3 + PrimeVue + Tailwind 4 frontend
- Docker-based server management (`ServerControllerV2`)
- Server config synchronization between JSON files and DB (`ServerConfigManagerV2`)
- Basic auth + role system (admin / moderator / user)

## Setup and Development Environment

The project uses a **devcontainer** for consistent development.

**Recommended workflow:**
1. Open the repository in VS Code with the Dev Container extension (ask for permission to continue before opening the project as a Dev Container)
2. The container will automatically run `.devcontainer/install-dependencies.sh`
3. Backend: `uv` + Python 3.13 virtual environment (`.venv`)
4. Frontend: `bun` / `pnpm` (both supported)

**Common commands** (run from project root):
- Backend dev server: `uv run tasks run-dev`
- Frontend dev server: `cd frontend && bun dev` or `pnpm dev`
- Run all tests: `uv run pytest`
- Lint & format: `uv run tasks lint` and `uv run tasks format`

## Build, Test and Validation Commands

**Backend:**
- Run tests: `uv run pytest`
- Run specific test: `uv run pytest tests/unit/test_utils_errors.py::test_pattern_matching_ok`
- Lint: `uv run tasks lint`
- Format: `uv run tasks format`
- Database migrations: `uv run tasks migrate`

**Frontend:**
- Dev: `cd frontend && bun dev` (or `pnpm dev`)
- Lint: `cd frontend && bun run lint`
- Build: `cd frontend && bun run build`

**Full project checks:**
- `uv run tasks check` → lint + tests (recommended before commits)

## Project Structure

Key directories (high-level only):

```
backend/
├── arservercontroller/          # Main package
│   ├── api/v1/                  # FastAPI routers
│   ├── services/                # Business logic (controller, config manager, user)
│   ├── db/                      # SQLAlchemy models + session
│   ├── schemas/                 # Pydantic models
│   └── utils/                   # Shared utilities (Result, directories, errors)
├── tests/
│   ├── unit/
│   └── integration/
├── alembic/                     # Database migrations
└── tasks.py                     # Project task runner (like Makefile)

frontend/
├── src/
│   ├── components/
│   ├── views/
│   ├── router.ts
│   └── App.vue
├── tailwind.config.js
└── vite.config.js
```

**Important files:**
- `backend/arservercontroller/services/docker.py` → `DockerContainerManger` (main Docker logic)
- `backend/arservercontroller/services/controller.py` → `ServerControllerV2` (main server logic)
- `backend/arservercontroller/services/server_config.py` → `ServerConfigManagerV2` (WIP)
- `backend/arservercontroller/main.py` → FastAPI app entrypoint
- `backend/arservercontroller/constants.py` → Directory manager & enums

## Code Style and Conventions

**Python**
- Modern PEP 8 / Ruff compatible
- Double quotes preferred
- Strong typing preferred; use `Any` or `object` only when necessary
- Comments only for non-obvious logic or important side-effects

**TypeScript / Vue (`<script setup lang="ts">`)**
- 4-space indent
- Allman-style braces (opening brace on new line)
- Double quotes
- **No semicolons**
- Single-line conditionals must break lines:

```ts
if (condition)
    doThing()
else
    doOther()
```

**Vue Templates**
- 2-space indent
- One tag per line (preferred)

**General**
- Favor clear names over explanatory comments
- Simple & readable > "future-proof"
- No Unicode drawing characters in comments

## Git Workflow and Contribution Rules

- Main development branch: `dev`
- Always work on feature/fix branches off `dev`
- Keep commits small and focused
- Write clear commit messages
- Before opening a PR: run `uv run tasks check`
- Do not merge directly to `main` (protected)

## Boundaries and Constraints

- **Target scale**: 3–20 servers max. Do not optimize for hundreds of servers.
- **Single developer**: Keep architecture simple. Avoid heavy abstraction layers. Ask for permission if doing large refactorings is beneficial in the long term.
- **Do not** introduce new heavy dependencies without asking first.
- **Before changing stack** (new libraries, major version bumps, new frameworks): ask for confirmation and explain productivity gain.
- Prefer extending existing patterns (`Result`, `ServerControllerV2`, `DockerContainerManager`) over creating new ones.
- Only refer to `docs/TODO.md` for tasks to work if no task were given. Ask for permission before generating code ralated to TODOs. Ignore all TODOs in code.

## Testing Strategy

- **Unit tests**: Focus on pure logic (Result type, validators, utils)
- **Integration tests**: Docker + database + config manager (`tests/integration/`)
- Always prefer integration tests for `ServerControllerV2` and `DockerContainerManager`
- Mock only when absolutely necessary (Docker client in some cases)
- Tests must be fast and reliable

## Architecture Decisions

- **ServerControllerV2** + **DockerContainerManager** + **ServerCreationManager** are the current stable core
- Config is kept in sync between JSON files on disk and SQLite `Server` rows
- `Result[T, E]` type is used for explicit error handling in critical paths
- Directory management is centralized in `constants.py` (`directory_manager`)
- All container paths are explicitly defined (host vs container)

Current flow for creating a server:
1. `POST /api/v1/servers` → creates DB row + calls `ServerControllerV2.add_serverV2`
2. `ServerCreationManager` queues server creation task to a worker thread, and calls `DockerContainerManager` for actual container creation then sends creation logs to websocker under `GET /api/v1/servers/ws/{server_id}/creation`

## Examples

**Good Python pattern**
```python
result = await some_operation()
if not result.is_ok():
    logger.error(...)
    return Result.fail(result.error())
```

**Good TypeScript pattern**
```ts
if (condition)
    doThing()
else
    doOther()
```

**Adding a new endpoint**
- Put route in `api/v1/servers.py` or `users.py`
- Use existing dependencies (`ServerControllerDep`, `ServerConfigMangerDep`, etc.)
- When creating dependencies place then in `api/dependencies.py` folder. If the dependency is a service (e.g. `ServerControllerV2`) place it together with the service on the same file
- Return Pydantic models from `schemas/`

**When in doubt**
- Keep it simple
- Make it work first
- Make it readable
- Ask if you're unsure about a design decision

---

**Last updated:** April 2026