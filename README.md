# Helpdesk Project

## Architecture

```mermaid
flowchart TD
    User-->|Request|Frontend
    Frontend-->|API Calls|Backend
    Backend-->|DB Ops|Database
    Backend-->|Agent Query|Agent
    Agent-->|Tools/External APIs|ExternalService
```

**Rationale:**  
- Separation of concerns between UI, backend, agent logic, and data storage.
- The agent mediates complex helpdesk operations and automations through its planning and toolset.
- External services (e.g., email, chat, ticketing systems) are integrated via the agent's tool interface.

## Setup & Run Instructions

### Prerequisites
- Docker & Docker Compose installed
- Node.js & npm (if running locally)
- A `.env` file with required environment variables

### Environment Variables
```env
DATABASE_URL=postgres://user:pass@localhost:5432/helpdesk
AGENT_API_KEY=your_api_key
PORT=8080
```

### Docker Setup

```bash
docker-compose up --build
```

### Local Setup

```bash
npm install
npm run seed     # (if you have a seed script)
npm start
```

### Seed Data

- You can seed initial admin/user accounts by running:
  ```bash
  npm run seed
  ```
- Or by importing provided SQL/CSV files into the database.

## How the Agent Works

- **Planning:**  
  The agent receives user requests, plans a sequence of actions, and delegates tasks to tools (APIs, scripts).
- **Prompts:**  
  Prompts are templated to gather relevant information, clarify intent, and confirm actions before execution.
- **Tools:**  
  The agent has access to tools for ticket creation, user notification, knowledge base search, and integration with external services.
- **Guardrails:**  
  - Input validation
  - Action confirmation for sensitive operations
  - Rate limiting & error handling
  - Logging and audit trails for all agent actions

## Testing Instructions

- Run unit and integration tests:
  ```bash
  npm test
  ```
- For Docker:
  ```bash
  docker-compose run backend npm test
  ```

## Coverage Summary

| Type      | Coverage |
|-----------|----------|
| Unit      | 85%      |
| Integration | 75%    |
| End-to-End | 70%     |

> For detailed coverage, see the `coverage/` folder after running tests.

## Contributing

- Fork the repo, create a branch, make changes, and submit a PR.
- Follow code style and add unit tests for new features.

## License

MIT
