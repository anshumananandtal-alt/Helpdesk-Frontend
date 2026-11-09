# Implementation decisions

1. **Use the backend's actual REST contract instead of the proposed API table.** The guide's `/auth/*`, nested ticket comments, `PATCH`, and several optional endpoints do not exist in this backend. The frontend calls the implemented `/users/*`, `/comments/tickets/*/comments`, `PUT /tickets/:id`, and `/admin/dashboard` routes. A separate API adapter keeps that mismatch isolated.
2. **Keep the interface intentionally limited where the backend cannot support safe behavior.** Customers are not shown a ticket list because the backend returns every user's tickets without server-side scoping. The UI maps backend `support` to the product term `agent`, and offers only backend-supported statuses.
3. **Handle concurrent updates with the ticket version.** Every ticket mutation sends the version returned by the API. A 409 invalidates the ticket query, displays a conflict message, and leaves the user able to retry against fresh data.
4. **Do not render internal notes or pretend audit history exists.** The backend returns ordinary comments and has no audit read endpoint, so the interface displays public comments only and states that the missing workflows require backend support.
5. **Store authentication in `sessionStorage`.** The current backend returns a JWT in its JSON response and does not provide refresh cookies. Session storage avoids a persistent token while allowing the page to reload. Axios attaches it only in the Authorization header; tokens are not logged or placed in URLs.

The app uses React Query for server state, Redux for the minimal auth session, and React Hook Form/Zod for validation. Tests cover role mapping and the status-transition permission helper. The API behavior and local quality checks are documented in [README.md](./README.md).
