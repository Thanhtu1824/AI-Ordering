# AI-First Ordering Platform

A next-generation e-commerce system where an AI Chatbot serves as the primary interface for users to place orders.

**Core Features:**
- **Automated Consulting & Ordering:** The AI automatically analyzes intent, discovers needs, searches for products, and processes orders through natural conversation.
- **Generative UI:** Visually displays UI components (e.g., detailed quote tables, shopping carts) directly within the chat interface instead of just plain text responses.
- **Safe Workflow (Human Handoff):** Covers the entire lifecycle from quotation to delivery, but automatically escalates to a human staff member when encountering sensitive situations (complaints, cancellations).

## 🏗 Technology Stack
- **Frontend**: Next.js (App Router), Tailwind CSS, shadcn/ui, socket.io-client
- **Backend**: NestJS, TypeScript, Socket.IO
- **Database**: PostgreSQL (managed by Prisma ORM), Redis
- **AI Core** (Upcoming): LangGraph, Google GenAI
- **Infrastructure**: Docker Compose

---

## 🚀 Commands Guide

Below is a list of important commands to run the project, categorized by purpose:

### 1. Package Installation & Management (Monorepo)
The project uses **npm workspaces** to manage multiple applications in the same directory.
- `npm install` : Install all dependencies for both Frontend and Backend.
- `npm install <package-name> --workspace=frontend` : Install an NPM package exclusively for the Frontend.
- `npm install <package-name> --workspace=backend` : Install an NPM package exclusively for the Backend.

### 2. Infrastructure (Docker)
The database (PostgreSQL) and cache (Redis) are run using Docker to ensure isolation.
- `docker-compose up -d` : Start the containers (Database, Redis) in the background.
- `docker-compose down` : Stop the containers.
- `docker-compose down -v` : Stop the containers and **delete all data** (Use this when you want to reset the DB and start from scratch).

### 3. Database (Prisma ORM)
All database-related operations are performed within the `apps/backend` directory.
- `cd apps/backend && npx prisma migrate dev` : Synchronize tables from the `schema.prisma` file into PostgreSQL and automatically generate the Prisma Client.
- `cd apps/backend && npx prisma studio` : Open the Web interface (in the browser) to visually view, add, edit, or delete data in the Database.

### 4. Running the Application
To run the project, you need to start both services simultaneously in 2 different Terminals:
- **Run Frontend (Port 3000):**
  ```bash
  npm run dev --workspace=frontend
  ```
- **Run Backend (Port 3001):**
  ```bash
  npm run start:dev --workspace=backend
  ```
