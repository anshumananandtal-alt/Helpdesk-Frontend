- The Helpdesk backend running and reachable

## Run locally

```bash
npm install
```

Set the API URL in a root `.env` file:

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
```

Then start the Vite development server:

```bash
npm run dev
```

The app's default API URL is `http://localhost:8080/api`. The frontend runs at the Vite default origin; configure the backend CORS origin to match it.

## Checks

```bash
npm run lint
npm test
npm run build
```

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/login` | Public | Sign in with an API account |
| `/register` | Public | Register a customer |
| `/tickets` | Authenticated | Staff ticket queue; customer queue is withheld until backend scoping is available |
| `/tickets/new` | Authenticated | Create a ticket |
| `/tickets/:id` | Authenticated | View ticket details and public comments |
| `/admin/dashboard` | Admin | Ticket/SLA report aggregates |
| `/403` | Public | Permission-denied screen |

## API integration

API calls are isolated in `src/api/` and use one Axios client. The client attaches the bearer token from `sessionStorage` and normalizes API errors. React Query owns server state; Redux stores only the signed-in user and token.

This frontend uses the backend's actual routes:

- `POST /users/signup` and `POST /users/login`
- `GET /tickets`, `GET /tickets/:id`, `POST /tickets`, and `PUT /tickets/:id`
- `GET /comments/tickets/:ticketId/comments` and `POST /comments/tickets/:ticketId/comments`
- `GET /admin/dashboard`

The frontend maps the backend's `support` role to the guide's `agent` terminology. Ticket statuses follow the backend enum (`open`, `in progress`, `resolved`, `closed`), not the additional states in the product guide. Ticket edits include the current `version`; on HTTP 409 the app tells the user the ticket was refreshed and allows a retry.

## Backend contract limitations

The frontend was checked against the backend source in the adjacent `Helpdesk_backend` project. A few requested workflows cannot be implemented safely until the server exposes the corresponding API behavior:

- `GET /tickets` returns all tickets and does not scope by the signed-in customer or implement the guide's filter/pagination parameters. The customer ticket queue therefore does not call it, avoiding exposure of other customers' tickets.
- User, ticket, and comment routes do not currently run JWT authentication middleware. UI role checks improve usability but are not an authorization boundary; server-side authorization is required before deployment.
- The backend has no internal-note distinction, audit-history route, user-management route, or ticket category field. The UI displays only public comments and does not fabricate those features.
- The backend's ticket status schema does not include `waiting_on_customer` or `reopened`; those transitions are not offered.
- Ticket mutation controllers expect `req.userId`, but current ticket routes do not attach authentication middleware. Thus status changes and self-assignment may be rejected until backend auth is wired.
- The backend source has startup import/export mismatches (including the rate-limiter import and ticket list handler) that must be corrected before the API can start. See the backend project's README for details.

These are server/API gaps, not client-side fallbacks. Do not remove the customer queue privacy guard or treat client permission checks as server security.

## Project layout

```text
src/
  api/                    Axios client and backend API functions
  app/                    Router, Redux store, React Query provider
  auth/                   Session state and route guards
  components/             Shared layout and data states
  features/
    admin/                Reports dashboard
    auth/                 Login and customer registration
    tickets/              Ticket queue, create, and detail flows
  lib/                    Role/status permission helpers
```
