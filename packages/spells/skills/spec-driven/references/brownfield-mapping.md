# Brownfield Mapping — Codebase Documentation Templates

This file provides 7 templates for codebase documentation, each with section headers, example content, and specific Scout delegation questions.

---

## 1. STACK.md — Technology Stack

**Purpose**: Quick reference for languages, frameworks, and tools used in the project.

### Template

```markdown
# Stack

## Languages

- **[Language Name]** [version] — [primary use, e.g., "backend API", "frontend", "tooling"]
- **[Language Name]** [version] — [primary use]

Example:
- **TypeScript** 5.2 — backend and frontend type safety
- **Python** 3.11 — tooling and data processing scripts

## Frameworks

- **[Framework]** [version] — [role, e.g., "Express for REST API", "React for UI"]
- ...

Example:
- **Express** 4.18 — REST API framework
- **React** 18.2 — frontend UI library
- **Zod** 3.20 — runtime type validation

## Package Manager

- **[Manager Name]** [version or default] — package management

Example:
- **npm** latest — JavaScript/TypeScript packages
- **pip** latest — Python packages

## Build Tools

- **[Tool]** [version] — [purpose, e.g., "TypeScript compilation", "bundling", "CSS preprocessing"]
- ...

Example:
- **tsc** 5.2 — TypeScript compilation
- **webpack** 5.x — module bundling
- **vite** 4.x — dev server and production build

## Deployment Targets

- **[Platform]** — [region/config if relevant]
- ...

Example:
- **AWS Lambda** — API functions
- **AWS S3 + CloudFront** — static frontend assets
- **AWS RDS PostgreSQL** — managed database
- **Docker** — containerized services
```

### Scout Delegation Questions

1. **What programming languages are used in this codebase, and what are their versions?** (Look at `.nvmrc`, `package.json`, `python-version`, `go.mod`, etc.)
2. **What are the main frameworks and libraries, and what role does each play?** (Look at `package.json` dependencies, import statements, framework setup files)
3. **How are dependencies managed?** (npm, pip, cargo, maven, etc.?)
4. **What build tools are configured, and what do they do?** (Look at `webpack.config.js`, `vite.config.ts`, `tsconfig.json`, `Makefile`, etc.)
5. **Where and how is the application deployed?** (Docker, serverless, VM, k8s, cloud platform? Look at `Dockerfile`, `docker-compose.yml`, `.github/workflows/`, CloudFormation templates, etc.)

---

## 2. ARCHITECTURE.md — System Design

**Purpose**: High-level overview of how components interact, module boundaries, data flow, key patterns.

### Template

```markdown
# Architecture

## High-Level Diagram

```
[Text ASCII diagram or description]

Example:
Client (React) → API Layer (Express) → Business Logic → Data Layer (PostgreSQL)
                    ↓
                Cache (Redis)
```

## Module Boundaries

| Module | Responsibility | Key Files | Dependencies |
|--------|----------------|-----------|--------------|
| **API Layer** | HTTP routing, request validation | `src/api/`, `src/routes/` | Express, Zod |
| **Business Logic** | Feature implementation, domain rules | `src/services/`, `src/models/` | Node.js stdlib |
| **Data Layer** | Database queries, ORM | `src/db/`, `src/queries/` | PostgreSQL, pg client |
| ... | ... | ... | ... |

## Data Flow

### Request Example: Create User

```
1. Client sends POST /users with JSON body
2. Express validates body with Zod schema
3. API route handler calls UserService.create()
4. UserService queries database for conflicts
5. Database returns result
6. UserService returns user object
7. Express serializes and returns JSON response
```

### Key Patterns

- **Dependency Injection**: Services injected via constructor (if applicable)
- **Middleware**: Request logging, auth checks, error handling
- **Transactions**: Database transactions for multi-step operations
- ...

## Entry Points

- **HTTP Server**: `src/index.ts` → starts Express on port 3000
- **CLI**: `bin/cli.js` → entry point for command-line tools
- **Worker**: `src/worker.ts` → background job processor
- ...

## Key Design Decisions

- **Layered architecture** — separation of concerns (API / Business / Data)
- **Async/await** — all I/O operations are asynchronous
- **Immutable config** — configuration loaded once at startup
- ...

## Known Limitations

- Monolithic structure; plans to split into microservices (see `.specs/project/STATE.md`)
- Synchronous database calls in admin routes (performance acceptable for low-traffic paths)
- No caching layer yet; Redis planned post-launch
```

### Scout Delegation Questions

1. **What are the major modules/layers in this codebase, and what does each one do?** (Look at directory structure, `package.json` scripts, main entry files)
2. **How do requests flow through the system from start to finish?** (Trace a request from client through layers; look for middleware, routing, service calls, database operations)
3. **What are the key architectural patterns or principles being used?** (Look for MVC, layered arch, event-driven, dependency injection, etc.)
4. **What are the main entry points (web server, CLI, worker, etc.), and where do they start?** (Look for `index.js`, `server.js`, `main.py`, `bin/` scripts, package.json scripts)
5. **Are there any known limitations or planned architectural changes?** (Look at comments, GitHub issues, TODO markers, ROADMAP)

---

## 3. CONVENTIONS.md — Code Patterns & Standards

**Purpose**: Naming rules, file organization, import style, error handling, logging patterns.

### Template

```markdown
# Conventions

## File Naming

- **Controllers**: `<resource>.controller.ts` (e.g., `user.controller.ts`)
- **Services**: `<resource>.service.ts` (e.g., `user.service.ts`)
- **Models/Types**: `<resource>.model.ts` or `types/<resource>.ts` (e.g., `user.model.ts`)
- **DTOs**: `<action>-<resource>.dto.ts` (e.g., `create-user.dto.ts`, `update-user.dto.ts`)
- **Utilities**: `<purpose>.util.ts` or `utils/<purpose>.ts`
- **Tests**: `<file>.test.ts` or `<file>.spec.ts` (same dir or `__tests__/` subdir)

## Naming Conventions

### Variables & Functions

- **camelCase** for variables, functions, methods: `getUserById`, `fetchUserData`
- **PascalCase** for classes, interfaces, types: `UserService`, `IUserRepository`
- **UPPER_SNAKE_CASE** for constants: `MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT`
- **lowercase_snake_case** for filenames: `user.service.ts`, `create-user.dto.ts`

### Routes/Endpoints

- **RESTful URLs**: `/users`, `/users/:id`, `/users/:id/orders`
- **Verbs in method, not URL**: `GET /users`, `POST /users`, `PUT /users/:id`

## Import Organization

```typescript
// 1. Node.js built-ins
import { resolve } from 'path';
import { EventEmitter } from 'events';

// 2. External packages
import express from 'express';
import { z } from 'zod';

// 3. Local app imports
import { UserService } from '../services/user.service';
import { userSchema } from '../schemas/user.schema';
import { config } from '../config';
```

## Error Handling

- **Custom error classes**: Extend `Error`, set message and status code: `new UserNotFoundError('User 123 not found', 404)`
- **Try-catch in async functions**: Catch known errors; re-throw or handle gracefully
- **Error boundaries in Express**: Middleware catches uncaught errors and returns JSON error response
- **No silent failures**: Always log errors with context (user ID, timestamp, stack trace)

## Logging

- **Levels**: DEBUG, INFO, WARN, ERROR
- **Structured logging**: Log as JSON objects with timestamp, level, message, context: `{ timestamp, level, message, userId, action }`
- **Sensitive data**: Never log passwords, tokens, API keys; mask in logs
- **Library**: Winston or Pino (specify which)

## Testing

- **Unit tests**: Test individual functions in isolation; mock external dependencies
- **Integration tests**: Test multiple modules together; use test database
- **Test naming**: describe blocks for modules, test cases starting with "should" (e.g., `should return user by ID`)
- **Fixtures**: Reusable test data in `tests/fixtures/` (e.g., `user.fixture.ts`)

## Comments

- **Avoid obvious comments**: "Get user" on `getUser()` is noise
- **Explain why, not what**: Why is this regex pattern needed? Why disable this lint rule?
- **TODO markers**: `// TODO: refactor this for performance (jira-123)`; include ticket reference if possible
- **JSDoc on public APIs**: Document params, return type, errors: `/** Get user by ID. @param id User ID @returns User object or null */`
```

### Scout Delegation Questions

1. **What file and folder naming patterns are used?** (Look at `src/` directory structure, file names)
2. **What naming conventions are used for variables, functions, classes, and constants?** (Look at code samples, linter config)
3. **How are imports organized in files?** (Look at a few .ts or .py files; check for import comments/grouping)
4. **How are errors handled and logged?** (Look for try-catch, error classes, error middleware, logging calls)
5. **What testing patterns are used, and where are tests located?** (Look at test directory, test file structure, test frameworks)

---

## 4. STRUCTURE.md — Directory Layout

**Purpose**: Annotated directory tree (3 levels), entry points, module responsibilities.

### Template

```markdown
# Structure

## Directory Tree (3 levels)

```
src/
├── index.ts                   # Server entry point
├── config/
│   ├── index.ts              # Configuration loader
│   ├── database.ts           # DB connection config
│   └── env.ts                # Environment variables
├── api/
│   ├── index.ts              # Express app setup
│   ├── routes/
│   │   ├── users.routes.ts   # User endpoints (GET, POST, PUT, DELETE /users)
│   │   ├── orders.routes.ts  # Order endpoints
│   │   └── health.routes.ts  # Health check endpoint
│   ├── middleware/
│   │   ├── auth.ts           # JWT authentication
│   │   ├── validate.ts       # Request validation (Zod schemas)
│   │   └── errors.ts         # Error handling
│   └── schemas/
│       ├── user.schema.ts    # Zod schemas for user validation
│       └── order.schema.ts   # Zod schemas for order validation
├── services/
│   ├── user.service.ts       # User business logic
│   ├── order.service.ts      # Order business logic
│   └── email.service.ts      # Email sending service
├── db/
│   ├── index.ts              # Database client export
│   ├── migrations/           # SQL migration files (001_initial.sql, etc.)
│   ├── queries/
│   │   ├── users.sql         # SQL queries for user operations
│   │   └── orders.sql        # SQL queries for order operations
│   └── types.ts              # TypeScript types for database models
├── utils/
│   ├── logger.ts             # Logging utility
│   ├── hash.ts               # Password hashing
│   └── date.ts               # Date utilities
└── tests/
    ├── fixtures/             # Test data files
    ├── user.service.test.ts  # UserService unit tests
    └── integration/
        └── api.test.ts       # API integration tests
```

## Key Entry Points

| File | Purpose | Command |
|------|---------|---------|
| `src/index.ts` | Start HTTP server | `npm start` → `node dist/index.js` |
| `bin/cli.js` | Command-line interface | `npm run cli -- --help` |
| `src/db/migrations/` | Database setup | `npm run migrate:up` |
| `src/tests/` | Test execution | `npm test` |

## Module Responsibilities

| Path | Responsibility |
|------|-----------------|
| `src/config/` | Load and validate environment, database config |
| `src/api/` | HTTP routes, request validation, error handling |
| `src/services/` | Business logic, feature implementation |
| `src/db/` | Database queries, ORM/client, migrations |
| `src/utils/` | Reusable helper functions |
| `src/tests/` | Unit and integration tests, fixtures |
```

### Scout Delegation Questions

1. **How is the project directory organized?** (Show the `src/` tree structure, explain what major directories are for)
2. **What are the entry points and how does the application start?** (Look at `index.ts`, `package.json` scripts, `main` field)
3. **What is each top-level directory responsible for?** (e.g., `src/api/` handles HTTP, `src/services/` has business logic, etc.)
4. **Are there any special directories for tests, migrations, config, or utilities?** (Look for `tests/`, `migrations/`, `config/`, `utils/`, etc.)

---

## 5. TESTING.md — Test Strategy & Coverage

**Purpose**: Test framework, coverage expectations, test file location pattern, fixture strategy, CI commands.

### Template

```markdown
# Testing

## Test Framework

- **Unit tests**: Jest
- **Integration tests**: Jest with test database
- **E2E tests**: (if applicable) Playwright or Cypress
- **Test runner**: `npm test`

## Test File Location Pattern

- Tests live in the same directory as the code being tested, named `<file>.test.ts` or `<file>.spec.ts`
- Example: `src/services/user.service.ts` → `src/services/user.service.test.ts`
- Alternatively, tests in a parallel `__tests__/` directory structure

## Coverage Expectations

- **Target**: 80% line coverage for services and utils
- **API routes**: 50% coverage (mocked database)
- **Integration tests**: Critical paths only (auth, user creation, order flow)
- **Current coverage**: Run `npm test -- --coverage` to see live stats

## Running Tests

```bash
# All tests
npm test

# Tests for a specific file
npm test -- user.service.test.ts

# Watch mode (re-run on file change)
npm test -- --watch

# Coverage report
npm test -- --coverage

# Integration tests only
npm test -- --testPathPattern=integration

# CI mode (single run, coverage)
npm run test:ci
```

## Test Database Setup

- **Local dev**: SQLite in-memory database (`.sqlite.test`)
- **CI**: PostgreSQL test instance (created per build)
- **Seeding**: Fixtures in `tests/fixtures/` loaded before each test suite
- **Cleanup**: Database reset after each test to ensure isolation

## Fixture Strategy

Reusable test data in `tests/fixtures/`:
- `tests/fixtures/user.fixture.ts` — sample user objects
- `tests/fixtures/order.fixture.ts` — sample order objects
- `tests/fixtures/seed.ts` — function to populate test database

Example fixture:
```typescript
export const defaultUser = {
  id: '1',
  email: 'test@example.com',
  password: 'hashedPassword123',
  createdAt: new Date('2026-01-01'),
};
```

## CI Commands

- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Tests**: `npm run test:ci` (single run with coverage)
- **Pre-commit**: `.husky/pre-commit` runs linter and tests

## Known Gaps

- E2E tests missing (planned post-MVP)
- API error edge cases not fully covered (coverage: 40%)
- Database migration rollback not tested

## Adding New Tests

1. Create test file in same directory as code or in `__tests__/`
2. Import the module under test
3. Set up fixtures
4. Write test cases with `describe` and `test` blocks
5. Run `npm test` to verify
6. Commit with message: `test(module): description`
```

### Scout Delegation Questions

1. **What test framework is used, and how are tests organized?** (Look for Jest, Vitest, Mocha config; test file locations)
2. **What test commands are available?** (Look at `package.json` scripts: `test`, `test:watch`, `test:ci`, `coverage`)
3. **What is the test coverage target and current status?** (Look at Jest config, CI logs, README)
4. **How are test fixtures and mock data managed?** (Look for `fixtures/`, `mocks/`, example test files)
5. **Is there a test database setup, and how is it seeded?** (Look for database-related test setup, `seed.ts`, or test lifecycle comments)

---

## 6. INTEGRATIONS.md — External APIs & Services

**Purpose**: External APIs, databases, message queues, third-party services with auth and version info.

### Template

```markdown
# Integrations

## HTTP APIs

| Service | Purpose | Auth | Version | Notes |
|---------|---------|------|---------|-------|
| **Stripe** | Payment processing | API Key (Bearer token) | v1 | Webhooks on port /webhooks/stripe; rate limit 1000 req/min |
| **SendGrid** | Email sending | API Key | v3 | Uses SENDGRID_API_KEY env var |
| **AWS S3** | File storage | AWS credentials | v4 signature | Bucket: `user-uploads-prod`; region: `us-east-1` |
| **OpenAI** | LLM completions | API Key | `gpt-4-turbo` | Used for summary generation; model may change |

## Databases

| Database | ORM/Client | Version | Purpose | Notes |
|----------|-----------|---------|---------|-------|
| **PostgreSQL** | pg (node-postgres) | 14+ | Primary data store | Connection pooling: 20 connections; host: localhost:5432 |
| **Redis** | redis | 7.x | Session cache | Used for active sessions; expires after 24h |

## Message Queues

| Queue | Library | Purpose | Notes |
|-------|---------|---------|-------|
| **Bull** | @nestjs/bull | Background jobs | Processes email sends, image resizing; retries 3x on failure |

## Configuration

### Environment Variables

```bash
# Stripe
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid
SENDGRID_API_KEY=SG.xxxxx

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=user-uploads-prod

# OpenAI
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
REDIS_URL=redis://localhost:6379

# Node
NODE_ENV=development
PORT=3000
```

## Integration Health Checks

| Service | Health Check | Endpoint | Timeout |
|---------|--------------|----------|---------|
| **Stripe** | List charges (list API) | `GET /health/stripe` | 5s |
| **SendGrid** | Verify API key | `GET /health/email` | 5s |
| **AWS S3** | List bucket objects | `GET /health/storage` | 10s |
| **PostgreSQL** | `SELECT 1` | `GET /health/db` | 5s |
| **Redis** | `PING` | included in `/health` | 3s |

## Known Issues & Workarounds

- **Stripe webhook retries**: If webhook fails, Stripe retries for 36 hours. Manually check webhook logs in Stripe dashboard. (See `.specs/project/STATE.md` blocker B-001)
- **SendGrid rate limit**: 30 messages/second across org. Plan sends during off-peak; batch send API for bulk. 
- **S3 ACL permissions**: Files uploaded to S3 are private by default; pre-signed URLs generated for sharing
```

### Scout Delegation Questions

1. **What external APIs, databases, or services does this project integrate with?** (Look at `package.json` dependencies, env var examples, `.env.example`, code imports)
2. **How is authentication handled for each integration?** (API keys, OAuth, AWS credentials? Where are secrets stored?)
3. **What are the version requirements for each external service?** (Look for version constraints in docs, comments, or version pinning)
4. **Are there health checks or monitoring for integrations?** (Look for health check endpoints, monitoring setup, status page links)
5. **What are known limitations or issues with current integrations?** (Look for comments, GitHub issues, performance notes, rate limits)

---

## 7. CONCERNS.md — Tech Debt & Risk Documentation

**Purpose**: Centralized risk registry (tech debt, security risks, performance risks, scalability concerns, operational risks).

For detailed guidance, see `concerns.md` in the references. This template is the basic header structure.

### Template

```markdown
# Concerns

This document tracks tech debt, security risks, performance bottlenecks, and operational concerns. See `concerns.md` for the full schema and categorization system.

## Overview

| Category | Count | Severity |
|----------|-------|----------|
| Tech Debt | 3 | medium |
| Security Risks | 1 | high |
| Performance Risks | 2 | medium |
| Scalability Concerns | 1 | low |
| Operational Risks | 2 | medium |

## Tech Debt

(See `concerns.md` for detailed C-NNN entries)

## Security Risks

(See `concerns.md` for detailed C-NNN entries)

## Performance Risks

(See `concerns.md` for detailed C-NNN entries)

## Scalability Concerns

(See `concerns.md` for detailed C-NNN entries)

## Operational Risks

(See `concerns.md` for detailed C-NNN entries)
```

### Scout Delegation Questions

1. **What outdated dependencies or deprecated patterns are in the codebase?** (Look at `package.json` for old versions, comments about legacy code, deprecated API usage)
2. **Are there any known security vulnerabilities or weak points?** (Look for hardcoded secrets, missing input validation, auth gaps, comments marking security TODOs)
3. **What performance concerns exist (slow queries, blocking code, memory leaks)?** (Look for database query comments, long-running operations, unoptimized loops)
4. **Are there scalability concerns (bottlenecks that would break under load)?** (Look for synchronous operations, connection limits, no caching, no CDN, comments about scaling)
5. **What operational risks exist (missing monitoring, error handling, graceful degradation)?** (Look for error middleware, logging, health checks, comments about production issues)

---

## Summary: Scout Delegation Pattern

For each doc type, Scout answers specific questions that are then synthesized into the template. The delegation contract is:

**Input from Forge to Scout**:
```
Map <doc_type>. Use the questions below and provide file:line references where applicable.
[5 specific questions from above]
```

**Output from Scout to Forge**:
```
SCOUT_FINDINGS:
Q1: [answer with specific file:line refs]
Q2: [answer with specific file:line refs]
...
Q5: [answer with specific file:line refs]
```

**Forge then populates the template** with Scout answers, preserving file references and examples.

---

## See Also

- `phase-map.md` — how to trigger and run the mapping phase
- `sub-agent-delegation.md` — Scout input/output contracts and delegation rules
- `concerns.md` — detailed schema for CONCERNS.md
