<!--
Sync Impact Report:
- Version change: 1.1.0 → 2.0.0
- BREAKING CHANGE: Complete technology stack migration from PHP/LAMP to Django/React
- Architecture shift: Multi-page application → Single-page application (SPA)
- Enhanced responsive design focus with React component architecture
- Templates requiring updates: ✅ all template references updated for new stack
- Follow-up TODOs: Update all development tooling and CI/CD for Python/Node.js stack
-->

# Initiate Constitution

## Core Principles

### I. Bounded Module Design (NON-NEGOTIABLE)
Every feature belongs to a bounded module with clear ownership. In the Django backend this means each app (`campaigns`, `characters`, `combat`, `content`, etc.) owns its own models, serializers, views, URLs, and tests. In the React frontend this means each feature owns its own component tree, types, and service calls.

**Cross-boundary communication rules:**
- ForeignKey relationships defined in `models.py` are permitted (e.g. `Character` has a FK to `Species`)
- Any other cross-app logic must go through a service function defined in the owning app (e.g. `campaigns.services.is_campaign_member(user, campaign_id)`)
- Direct model imports across app boundaries outside of `models.py` ForeignKeys are a violation
- React components must not reach into another feature's internal state — shared logic goes in `utils/` or `services/`

**Technical Debt**: `combat/consumers.py` directly imports `CampaignMembership` from the campaigns app. This must be refactored to use a service function before story 001 is considered complete.

**Rationale**: Prevents tight coupling between modules, ensures each module is independently testable and reusable, and makes the impact of changes predictable and contained.

### II. Test-Driven Development
TDD is enforced at the contract and business logic level. Before `/speckit.implement` runs, the `contracts/` directory must contain API contract tests for all new endpoints and the user must approve them. Business logic with complex rules (D&D calculations, combat resolution, permission checks, character stat derivations) must follow strict Red-Green-Refactor — tests written and failing before implementation begins.

UI component tests are encouraged but not implementation-blocking. Simple presentational components that render data do not require tests before implementation.

**Technical Debt**: Story 001 was implemented without tests. All API endpoints and business logic from story 001 must have tests backfilled before story 001 is considered complete.

**Rationale**: Focuses TDD discipline where bugs are most expensive — API contracts and rules logic — without creating process overhead for low-risk UI rendering code.

### III. Technology Stack Compliance
Core technologies: Python Django backend with Django REST Framework, React frontend with modern JavaScript (ES6+), PostgreSQL database, and containerized deployment. Single-page application architecture with component-based responsive design. Any additional technologies require developer proposal with documented pros/cons and team approval before integration.

**Rationale**: Provides robust backend framework with excellent API capabilities, modern reactive frontend for optimal user experience, and scalable database solution suitable for complex relational data.

### IV. Single-Page Application Design
All interfaces must be built as a responsive single-page application using React components. Component architecture must be modular, reusable, and optimized for desktop, tablet, and mobile viewports. State management and routing handled through modern React patterns.

**Rationale**: Ensures fluid user experience, better performance through client-side routing, and maintainable component-based architecture that scales with application complexity.

### V. Technology Review Process
New technology adoption requires: problem statement, evaluation of alternatives, pros/cons analysis, team consensus. No technology additions without documented justification and approval.

**Rationale**: Prevents technical debt accumulation and ensures intentional architectural decisions.

### VI. Accuracy and Intellectual Honesty (NON-NEGOTIABLE)
Accuracy is non-negotiable. All game rules, stat calculations, mechanics, and data representations must faithfully reflect the source material. When something is unknown, uncertain, or approximated, it must be clearly labelled as such — never silently guessed or papered over. This applies equally to code (a calculation that might be wrong must have a comment noting the uncertainty), to AI-generated work (speculative implementations must be flagged), and to documentation (known gaps must be stated explicitly rather than omitted).

Intellectual honesty requires that technical debt, bugs, limitations, and open questions are surfaced and tracked rather than hidden. A `# TODO` or a technical debt entry in the constitution is always preferable to a false assertion of completeness.

**Rationale**: D&D mechanics are complex and interdependent. Silent inaccuracies compound quickly — a wrong modifier calculation affects saving throws, skills, attack rolls, and spell DCs simultaneously. Trust in the application depends entirely on correctness. Intellectual honesty about uncertainty is the foundation of that trust.

### VII. API Integration and Data Consistency (NON-NEGOTIABLE)
All game content (species, classes, subclasses, monsters, magic items, etc.) must follow unified data patterns whether sourced from static JSON API or user-generated content. Dynamic character sheets and DM-created NPCs must utilize the same database schema and validation rules as core API data. Django REST Framework serializers ensure consistent API responses for React frontend consumption.

**Rationale**: Ensures seamless integration between official content and user customizations, maintaining data integrity and consistent user experience across all content sources with type-safe API contracts.

## Technology Standards

### Required Stack Components
- **Backend**: Python Django with Django REST Framework for API development
- **Frontend**: React with modern JavaScript (ES6+), component-based architecture, responsive design
- **Database**: PostgreSQL for all environments (development and production). SQLite is explicitly prohibited due to concurrency limitations and behavioral differences that mask production bugs. Local development uses the provided Docker Compose configuration to run a Postgres container.
- **API Layer**: RESTful endpoints using Django REST Framework with serializers for type-safe data exchange
- **PDF Generation**: Python libraries (ReportLab or WeasyPrint) for document export
- **Infrastructure**: Docker containers for development and production deployment. Docker is a required dependency — all contributors must have Docker installed. `docker compose up -d db` starts the local database.
- **Styling**: CSS Modules (`.module.css`) for all component-level styles. Global design tokens (colors, spacing, typography) defined as CSS custom properties in `index.css`. Shared layout patterns (page structure, hero, tabs, cards) in `styles/pages.css`. No new global stylesheets for component-specific styles. Mobile-first responsive design principles throughout.

  **Technical Debt**: Story 001 used plain global CSS files (`CharacterSheet.css`, `EncumbranceStatus.css`, `Inventory.css`, etc.). These must be migrated to CSS Modules before story 001 is considered complete. New components written from story 002 onwards must use CSS Modules.

### Performance Requirements
- Django ORM queries must be optimized with proper indexing for both static and dynamic content
- API responses must maintain consistent performance whether serving JSON files or database records
- React components must be optimized for performance (lazy loading, memoization, code splitting)
- Single-page application must load quickly with progressive enhancement
- PDF generation must handle large datasets efficiently  
- Docker containers must follow best practices for security and performance

## REST API Authentication

### Token Standard
The backend uses `djangorestframework-simplejwt`. All REST API requests are authenticated via JWT. Tokens are passed in the `Authorization` header as `Bearer <token>`. DRF's built-in token auth (`rest_framework.authtoken`) is not used and must not be introduced.

### Default Protection Stance
All endpoints are protected by default. `DEFAULT_PERMISSION_CLASSES` is set globally to `[IsAuthenticated]`. Any endpoint that must be publicly accessible (e.g. login, registration, read-only content) must explicitly declare `permission_classes = [AllowAny]` on the view. This must be documented in the view with a comment explaining why it is public.

### Known Public Endpoints
At minimum the following endpoints are public: user login (`/api/v1/users/auth/login/`) and user registration. All other endpoints require authentication unless explicitly opted out per the rule above.

### Token Lifecycle
- **Access token**: 24-hour lifetime.
- **Refresh token**: 7-day lifetime, with rotation and blacklisting enabled (`ROTATE_REFRESH_TOKENS`, `BLACKLIST_AFTER_ROTATION`). Each successful refresh issues a new refresh token and invalidates the old one.
- **Frontend auto-refresh**: `apiClient.ts` intercepts 401 responses, attempts a token refresh, and retries the original request transparently. If the refresh fails, both tokens are cleared from storage and the user is redirected to `/login`.

### Token Storage
Both `access_token` and `refresh_token` are stored in `localStorage`. This is the current accepted approach.

**Security note**: `localStorage` is accessible to any JavaScript on the page, meaning a successful XSS attack can steal tokens. Before production deployment, evaluate migrating to `HttpOnly` cookies to eliminate this attack surface. This is a known limitation, not an oversight.

## Real-Time Communication

### When to Use WebSockets
WebSockets are for features where multiple connected clients must see state changes immediately: combat (initiative order, turns, HP changes, spell effects), live session presence. Use standard REST API for everything else — CRUD operations, data loading, form submissions, campaign management. Do not use WebSockets to avoid writing a proper REST endpoint.

### Backend Consumer Standards
- All consumers must extend `BaseAuthenticatedConsumer` from `apps.common.consumers`. Anonymous connections are rejected at the base class level — never skip this.
- Consumers follow the `handle_{message_type}` dispatch pattern. Each incoming message must have a `type` field. Add a method `handle_<type>` to the consumer class to handle it.
- Consumers belong to the app that owns the domain (e.g. `apps.combat` owns `CombatConsumer`). Consumers in `apps.common` are base classes only.
- Cross-app service functions (not direct model imports) must be used when a consumer needs data from another app's domain.

### Frontend WebSocket Standards
- Use the `CombatWebSocketClient` pattern from `services/websocketClient.ts` as the template for any new WebSocket client class.
- Clients must implement auto-reconnect with a minimum 3-second delay.
- All incoming messages must be parsed and dispatched through registered handlers — no inline `onmessage` logic in components.
- WebSocket clients must be disconnected in the React component's cleanup function (`useEffect` return).

### Authentication
- JWT token passed as `?token=` query parameter on the WebSocket URL. The token is read from `localStorage` by the client.
- **Security note**: Token in URL is logged by servers. Before production deployment, evaluate migrating to a short-lived WebSocket ticket system to avoid token exposure in access logs.

### Message Format
All WebSocket messages (inbound and outbound) must follow:
```json
{ "type": "message_type_name", ...payload fields }
```

## Development Workflow

### Code Organization
- Libraries placed in dedicated modules with clear interfaces (Django apps and React components)
- API endpoints organized by resource type using Django REST Framework ViewSets and routers
- React components organized by feature with clear component hierarchy and props interfaces
- Data models must support both static content loading and dynamic user content management
- Tests colocated with implementation files (Django tests and Jest/React Testing Library)
- Styling organized by component with CSS modules or styled-components
- Database migrations tracked and versioned through Django's migration system
- Docker configuration documented and version-controlled for both Django and React environments

### Quality Gates
- All code must pass unit tests before commit (Django tests and Jest tests)
- Integration tests required for API endpoints and database interactions
- React component testing with React Testing Library for user interaction validation
- Data validation must be consistent between static JSON content and user-generated content
- API contract tests must verify Django REST Framework serializer compatibility
- React components must render correctly across target devices and screen sizes
- Docker builds must complete successfully in CI/CD pipeline for both backend and frontend

## Governance

This constitution supersedes all other development practices. All PRs/reviews must verify compliance with these principles. Technology stack deviations require documented approval process. Complexity must be justified against simpler alternatives.

**Version**: 2.2.0 | **Ratified**: 2026-04-11 | **Last Amended**: 2026-04-20
