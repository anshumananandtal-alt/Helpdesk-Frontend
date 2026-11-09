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
| `/tickets` | Authenticated | Server-filtered ticket queue; customers see only their own tickets |
| `/tickets/new` | Authenticated | Create a ticket with optional category |
| `/tickets/:id` | Authenticated | View ticket details, conversation, and permitted ticket activity |
| `/admin/dashboard` | Admin | Ticket/SLA report aggregates |
| `/admin/users` | Admin | Change user roles and deactivate/reactivate accounts |
| `/403` | Public | Permission-denied screen |

## API integration

API calls are isolated in `src/api/` and use one Axios client. The client attaches the bearer token from `sessionStorage` and normalizes API errors. React Query owns server state; Redux stores only the signed-in user and token.

This frontend uses the backend's actual routes:

- `POST /users/signup` and `POST /users/login`
- `GET /tickets` (server-side filters and pagination), `GET /tickets/:id`, `POST /tickets`, and `PUT /tickets/:id`
- `GET /comments/tickets/:ticketId/comments` and `POST /comments/tickets/:ticketId/comments`
- `GET /tickets/:ticketId/audit` (staff only)
- `GET /admin/dashboard`
- `GET /users` and `PATCH /users/:id` (admin only)

The backend scopes customer ticket results to the authenticated user. Ticket filters and pagination are sent to the server and synchronized with the URL. The frontend maps the backend's `support` role to the guide's `agent` terminology and uses the backend status values (`open`, `in_progress`, `waiting_on_customer`, `resolved`, `reopened`, `closed`). Ticket edits include the current `version`; on HTTP 409 the app refreshes the ticket and explains that the user can retry.

Customers see public comments only. Staff can add and view internal notes and read the audit history. Ticket creation and updates derive identity and enforce permissions on the backend; frontend role checks are only for user experience.

Admins can update user roles and account active state from the user management page. The backend prevents admins from changing their own access or removing the last active administrator. Dashboard reports include visual ticket-status and SLA-breach charts backed by the admin dashboard API.

Admins can assign or unassign tickets from the ticket detail page. The assignee selector lists only active agents; the backend validates assignments, and agents can assign tickets to themselves.

## Project layout

```text
src/
  api/                    Axios client and backend API functions
  app/                    Router, Redux store, React Query provider
  auth/                   Session state and route guards
  components/             Shared layout and data states
  features/
    admin/                Reports dashboard and user management
    auth/                 Login and customer registration
    tickets/              Ticket queue, create, and detail flows
  lib/                    Role/status permission helpers
```
