# Smart Helpdesk with Agentic Triage

## Overview

This is a comprehensive helpdesk application built with the MERN stack that automates support ticket management through AI-powered triage. The system allows users to create support tickets, while an intelligent agent automatically classifies them, retrieves relevant knowledge base articles, drafts responses, and either auto-resolves tickets or assigns them to human agents based on confidence thresholds.

The application follows a three-tier architecture with distinct roles (Admin, Agent, User) and implements role-based access control throughout the system. It features real-time ticket processing, comprehensive audit trails, and a modern React-based user interface built with shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built using React 18 with TypeScript, leveraging Vite for fast development and builds. The UI is constructed with shadcn/ui components, providing a consistent design system built on Radix UI primitives and Tailwind CSS. State management is handled through React Query for server state and React Context for authentication state. Navigation is managed by Wouter for client-side routing.

### Backend Architecture  
The server implements a RESTful API using Express.js with TypeScript. The architecture follows a layered approach with clear separation of concerns:
- Route handlers manage HTTP requests and responses
- Service layer contains business logic (authentication, agent processing, knowledge base search)
- Storage abstraction layer provides database operations
- Middleware handles authentication, authorization, and rate limiting

### Authentication & Authorization
JWT-based authentication is implemented with role-based access control (RBAC). Three distinct roles are supported: Admin (manages KB articles and system configuration), Agent (reviews and responds to tickets), and User (creates tickets and views responses). Tokens are stored in localStorage on the client and validated via middleware on protected routes.

### Agentic Triage System
The AI agent workflow is implemented as a Node.js service that processes tickets through multiple stages:
1. **Classification**: Categorizes tickets into billing, technical, shipping, or other
2. **Knowledge Retrieval**: Searches KB articles using keyword matching
3. **Response Generation**: Creates draft responses with citations
4. **Confidence Scoring**: Determines whether to auto-resolve or assign to humans
5. **Audit Logging**: Tracks each step with trace IDs for observability

The system includes a stub LLM provider for development that uses keyword-based classification and templated responses, allowing the application to function without external AI service dependencies.

### Database Schema
Uses Drizzle ORM with PostgreSQL, implementing a relational schema with the following core entities:
- Users table with role-based permissions
- Tickets with status tracking and assignee relationships
- Knowledge base articles with tagging and publishing workflow  
- Agent suggestions storing AI-generated responses and confidence scores
- Audit logs for complete traceability of ticket lifecycle
- Configuration table for system-wide settings

### Data Flow & Processing
Ticket creation triggers an asynchronous triage workflow that processes through classification, KB retrieval, and response generation. Each step is logged to an audit trail with unique trace IDs. Based on confidence thresholds and admin configuration, tickets are either auto-resolved or assigned to human agents. The system maintains complete state transitions and provides real-time updates to all stakeholders.

## External Dependencies

### Core Framework Dependencies
- **Express.js**: Web application framework for the REST API server
- **React 18**: Frontend library with hooks and concurrent features
- **Vite**: Build tool and development server for fast frontend development
- **TypeScript**: Type safety across both client and server codebases

### Database & ORM
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect
- **@neondatabase/serverless**: Serverless PostgreSQL driver for database connections
- **Drizzle Kit**: Database migration and schema management tools

### UI Component Libraries
- **shadcn/ui**: Complete component library built on Radix UI primitives
- **Radix UI**: Unstyled, accessible component primitives (dialogs, dropdowns, forms, etc.)
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography

### State Management & API
- **TanStack React Query**: Server state management with caching and synchronization
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation for both frontend and backend
- **Wouter**: Lightweight client-side routing library

### Authentication & Security  
- **jsonwebtoken**: JWT token generation and verification
- **bcryptjs**: Password hashing and comparison
- **express-rate-limit**: Rate limiting middleware for API protection

### Development & Tooling
- **tsx**: TypeScript execution engine for development server
- **esbuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind integration
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

### Date & Utility Libraries
- **date-fns**: Modern date utility library for formatting and manipulation
- **clsx & class-variance-authority**: Conditional CSS class name utilities
- **nanoid**: Secure URL-friendly unique ID generator