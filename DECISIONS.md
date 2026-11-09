# Implementation decisions

1. **Use the backend's compatible REST routes through a small API layer.** The frontend uses `/users/*` auth routes, the compatible `/comments/tickets/*/comments` routes, `PUT /tickets/:id`, and `/admin/dashboard`. API paths stay isolated in `src/api/`.
2. **Use server-side authorization and filtering for ticket views.** The backend scopes customer ticket lists to the authenticated creator and supports server-side filters and pagination, so customers can safely see their own tickets. The UI maps backend `support` to the product term `agent` and uses the backend's underscore-separated status values.
3. **Handle concurrent updates with the ticket version.** Every ticket mutation sends the version returned by the API. A 409 invalidates the ticket query, displays a conflict message, and leaves the user able to retry against fresh data.
4. **Keep private and public ticket activity distinct.** Customer comment requests return public comments only. Staff can view internal notes and the existing staff-only audit endpoint; the UI still filters internal notes out of the customer view.
5. **Store authentication in `sessionStorage`.** The current backend returns a JWT in its JSON response and does not provide refresh cookies. Session storage avoids a persistent token while allowing the page to reload. Axios attaches it only in the Authorization header; tokens are not logged or placed in URLs.

The app uses React Query for server state, Redux for the minimal auth session, and React Hook Form/Zod for validation. Tests cover role mapping and the status-transition permission helper. The API behavior and local quality checks are documented in [README.md](./README.md).
