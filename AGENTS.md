# Agent Guidelines for ARServerController

This document provides clear instructions for AI coding agents (Cursor, Copilot, Claude, etc.) working on **ARServerController** — a lightweight, self-hosted dashboard for managing a small number of Arma Reforger dedicated servers in Docker containers.

You are an expert Python and Typescript with Vue3 developer.

## Project Overview

ARServerController is a minimal web dashboard to create, start, stop, and monitor Arma Reforger dedicated servers running inside Docker containers.
It targets **small private groups** (typically 3–20 servers) and is explicitly **not** designed for large-scale or public use.

**Core priorities:**
- Working code and developer productivity over perfect architecture
- Developed and maintained by a single developer
- Keep everything simple, readable, and fast to iterate on
- Focus on real usability for private Arma Reforger communities

Backend tech stack:
- See `backend/pyproject.toml`. Uses uv (v0.10.12)
- See `backend/agent-service/go.mod` for Go related tooling

Frontend tech stack:
- See `frontend/package.json`. Uses Bun (1.3.0)

Current main features:
- Docker-based server management (`ServerControllerV2`)
- Docker container layer management (`DockerContainerManager`)
- Creation of servers in background jobs (`ServerCreationManager`)
- Basic event bus (`ServerEventBus`)
- Container agent sidecar-like program to manage dedicated servers (`backend/agent-service`)
- Server config synchronization between JSON files and DB (`ServerConfigManagerV2`)
- Basic auth + role system (admin / moderator / user)

Current flow for creating a server:
1. `POST /api/v1/servers` → creates DB row + calls `ServerControllerV2.add_serverV2`
2. `ServerCreationManager` queues server creation task to a worker thread, and calls `DockerContainerManager` for actual container creation then sends creation logs to websocker under `GET /api/v1/servers/ws/{server_id}/creation`

## Setup and Development Environment

**Recommended workflow:**
1. Run `backend/tasks.py install` to install backend dependencies and setup the virtual environment, if the command fails make the script executable by calling `chmod +x backend/tasks.py`
2. Run `bun i --cwd frontend/` to install frontend dependencies.

**Devcontainer**:
1. Open the repository in VS Code with the Dev Container extension
2. The container will automatically run `.devcontainer/install-dependencies.sh`

**Common commands** (run from project root):
- Backend dev server: `./tasks.py run-dev`
- Frontend dev server: `cd frontend && bun dev`
- Run backend tests: `uv run pytest`
- Backend lint & format: `./tasks.py lint` and `./tasks.py format`
- List all tasks: `./tasks.py --help-tasks`

## Build, Test and Validation Commands

**Backend:**
- Run specific test: `uv run pytest tests/unit/test_utils_errors.py::test_pattern_matching_ok`
- Database migrations: `./tasks.py migrate`

**Frontend:**
- Dev: `cd frontend && bun dev`
- Lint: `cd frontend && bun run lint` and `cd frontend && bun run lint:check`
- Build: `cd frontend && bun run build`

## Project Structure

```
backend/
├── agent-service/               # Container agent sidecar
│   ├── cmd/                     # Agent entrypoint
│   └── internal/                # Internal agent logic
├── arservercontroller/          # Main package
│   ├── api/v1/                  # FastAPI routers
│   ├── services/                # Business logic (controller, config manager, user)
│   ├── db/                      # SQLAlchemy models + session
│   ├── schemas/                 # Pydantic models
│   └── utils/                   # Shared utilities (Result, directories, errors)
├── data/                        # Runtime app data (SQLite DB, server configs, logs)
├── tests/
│   ├── unit/
│   └── integration/
├── alembic/                     # Database migrations
└── tasks.py                     # Project task runner (like Makefile)

frontend/
├── src/
│   ├── components/
│   ├── composables/             # Vue composables
│   ├── stores/                  # Pinia stores
│   ├── views/
│   ├── router.ts
│   └── App.vue
├── tailwind.config.ts
└── vite.config.ts

docs/                            # Documents related to the project
└── TODO.md                      # Project TODO list
```

**Important files:**
- `backend/arservercontroller/services/docker.py` → `DockerContainerManager` (main Docker logic)
- `backend/arservercontroller/services/controller.py` → `ServerControllerV2` (main server logic)
- `backend/arservercontroller/services/server_config.py` → `ServerConfigManagerV2`
- `backend/agent-service/cmd/agent/main.go` → Agent sidecar entrypoint
- `backend/arservercontroller/main.py` → FastAPI app entrypoint
- `backend/arservercontroller/constants.py` → Directory manager & enums
- `backend/arservercontroller/core/config.py` → App configuration (prod, dev, test, etc.)

## Code Style and Conventions

**Python**
- Modern PEP 8 / Ruff compatible
- Double quotes preferred
- Strong typing preferred; use `Any` or `object` only when necessary

**TypeScript / Vue (`<script setup lang="ts">`)**
- 4-space indent
- Double quotes
- Single-line conditionals must have braces:

```ts
if (condition) {
    doThing()
}
else {
    doOther()
}
```

**Vue Templates**
- 2-space indent
- One tag per line (preferred)

**General**
- Favor clear names over explanatory comments
- Simple & readable > "future-proof"
- Comments only for non-obvious logic or important side-effects
- No Unicode drawing characters in comments, for example "→" or "←"
- No em-dashes in comments

## Testing Strategy

- **Unit tests**: Focus on pure logic (Result type, validators, utils)
- **Integration tests**: Docker + database + config manager (`tests/integration/`)
- Always prefer integration tests for `ServerControllerV2` and `DockerContainerManager`
- Mock only when absolutely necessary (Docker client in some cases)
- Tests must be fast and reliable

## Boundaries, Constraints and Best Practices

Constraints & Boundaries:
- **Before doing any task** ask for permission to proceed first.
- **Refer to `docs/TODO.md` only** for tasks to work if no task were given. Ignore all TODOs in code.
- **Do not** introduce new heavy dependencies without asking first.
- **Before changing the stack** (new libraries, major version bumps, new frameworks): ask for confirmation and explain productivity gain.
- **Target scale**: 3–20 servers max. Do not optimize for hundreds of servers.
- **Single developer**: Keep architecture simple. Avoid heavy abstraction layers. Ask for permission if doing large refactorings is beneficial in the long term.

Best Practices:
- Check surrounding code for patterns, best practices, naming conventions and architectural choices in the file/directory of the work.
- Prefer extending existing patterns, over creating new ones.
- Break large changes into tracked steps, decompose substantial work into manageable subtasks. Track progress to prevent scope creep and missed items. Use TODO list tools to maintain a checklist.
- Batch multiple edits instead of sequential single edits. Use batch edit tools if available.

Documentation:

After any code change, update relevant docs before committing:

- `docs/TODO.md` - remove tasks from the file if they are finished
- `AGENTS.md` directory structure - update when adding or removing source files

**When in doubt:**
- Keep it simple
- Make it work first
- Make it readable
- Ask if you're unsure about a design decision

---

**Last updated:** April 2026