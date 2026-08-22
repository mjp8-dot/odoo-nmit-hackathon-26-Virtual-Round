# Auth module — Laptop 1

This module owns sign-in/out actions, verified session access, role guards, auth
DTOs, and auth-specific components. Feature modules call requireUser or
requireRole close to server-side data access. They must not trust proxy redirects
or client-visible role state as authorization.

