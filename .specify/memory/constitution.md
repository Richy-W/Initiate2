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

### I. Library-First (NON-NEGOTIABLE)
Every feature starts as a standalone library. Libraries must be self-contained, independently testable, and documented with clear purpose. No organizational-only libraries - each must provide specific functionality that can be unit tested in isolation.

**Rationale**: Promotes modularity, testability, and reusability while preventing tight coupling and enabling parallel development.

### II. Test-Driven Development (NON-NEGOTIABLE)
TDD mandatory: Tests written → User approved → Tests fail → Then implement. Red-Green-Refactor cycle strictly enforced. All code must have accompanying unit tests before implementation begins.

**Rationale**: Ensures code quality, prevents regression, and validates requirements before implementation effort is invested.

### III. Technology Stack Compliance
Core technologies: Python Django backend with Django REST Framework, React frontend with modern JavaScript (ES6+), PostgreSQL database, and containerized deployment. Single-page application architecture with component-based responsive design. Any additional technologies require developer proposal with documented pros/cons and team approval before integration.

**Rationale**: Provides robust backend framework with excellent API capabilities, modern reactive frontend for optimal user experience, and scalable database solution suitable for complex relational data.

### IV. Single-Page Application Design
All interfaces must be built as a responsive single-page application using React components. Component architecture must be modular, reusable, and optimized for desktop, tablet, and mobile viewports. State management and routing handled through modern React patterns.

**Rationale**: Ensures fluid user experience, better performance through client-side routing, and maintainable component-based architecture that scales with application complexity.

### V. Technology Review Process
New technology adoption requires: problem statement, evaluation of alternatives, pros/cons analysis, team consensus. No technology additions without documented justification and approval.

**Rationale**: Prevents technical debt accumulation and ensures intentional architectural decisions.

### VI. API Integration and Data Consistency (NON-NEGOTIABLE)
All game content (species, classes, subclasses, monsters, magic items, etc.) must follow unified data patterns whether sourced from static JSON API or user-generated content. Dynamic character sheets and DM-created NPCs must utilize the same database schema and validation rules as core API data. Django REST Framework serializers ensure consistent API responses for React frontend consumption.

**Rationale**: Ensures seamless integration between official content and user customizations, maintaining data integrity and consistent user experience across all content sources with type-safe API contracts.

## Technology Standards

### Required Stack Components
- **Backend**: Python Django with Django REST Framework for API development
- **Frontend**: React with modern JavaScript (ES6+), component-based architecture, responsive design
- **Database**: PostgreSQL with Django ORM for schema management and migrations  
- **API Layer**: RESTful endpoints using Django REST Framework with serializers for type-safe data exchange
- **PDF Generation**: Python libraries (ReportLab or WeasyPrint) for document export
- **Infrastructure**: Docker containers for development and production deployment
- **Styling**: CSS-in-JS or CSS modules with React, mobile-first responsive design principles

### Performance Requirements
- Django ORM queries must be optimized with proper indexing for both static and dynamic content
- API responses must maintain consistent performance whether serving JSON files or database records
- React components must be optimized for performance (lazy loading, memoization, code splitting)
- Single-page application must load quickly with progressive enhancement
- PDF generation must handle large datasets efficiently  
- Docker containers must follow best practices for security and performance

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

**Version**: 2.0.0 | **Ratified**: 2026-04-11 | **Last Amended**: 2026-04-11
