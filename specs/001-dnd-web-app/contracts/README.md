# API Contracts

This directory contains interface contracts for the D&D Web Application, defining the external interfaces exposed to users and systems.

## Contract Types

### REST API Endpoints (`api-endpoints.yaml`)
- RESTful web service interfaces for frontend consumption
- Authentication endpoints for user management
- CRUD operations for characters, campaigns, and content
- Real-time combat tracking endpoints

### WebSocket Messages (`websocket-schema.yaml`)
- Real-time communication protocol for campaign features
- Initiative tracking updates during combat
- Live character sheet synchronization
- Campaign notifications and messaging

### Database Schema (`database-schema.sql`)
- PostgreSQL schema definition
- Table relationships and constraints
- Indexes for performance optimization
- Migration strategy documentation

## Usage

These contracts serve as:
- **Development Reference**: Frontend and backend teams can develop against defined interfaces
- **Testing Specification**: Contract tests validate API compliance
- **Documentation**: External developers can understand system interfaces
- **Version Management**: Breaking changes are tracked across contract versions