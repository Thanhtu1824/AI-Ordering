# AI First Ordering Platform - Technical Architecture

## Frontend
- Next.js
- React
- TypeScript
- shadcn/ui

## AI Layer
- LLM Provider: Google Gemini (Gemini 1.5 Pro / Flash)
- Integration Framework: LangChain (@langchain/core, @langchain/google-genai)
- Embeddings: Google Generative AI Embeddings

## AI Workflow
- Multi-Agent Orchestration: LangGraph (@langchain/langgraph)

## Backend
- NestJS
- TypeScript

## Database
- PostgreSQL

## Cache
- Redis

## Vector Database
- Qdrant

## Search
- Elasticsearch

## Event Bus
- Apache Kafka

## Realtime
- WebSocket
- Socket.IO

## Scraping
- Playwright

## Storage
- Cloudflare R2

## Monitoring
- Prometheus
- Grafana

## Containerization
- Docker

## Orchestration
- Kubernetes

## AI Agents
- Authentication Agent
- Intent Agent
- Need Discovery Agent
- Product Discovery Agent
- Product Resolution Agent
- Quote Agent
- Order Agent
- Payment Agent
- Tracking Agent
- Complaint Agent
- Human Handoff Agent

## High Level Architecture

AI Chat UI
→ Google Gemini
→ LangGraph
→ NestJS
→ Kafka
→ Services

Services:
- Order Service
- Payment Service
- Warehouse Service
- Logistics Service
- Complaint Service
- CRM Service

Data Layer:
- PostgreSQL
- Redis
- Qdrant
- Elasticsearch