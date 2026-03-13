cd C:\GoProjects\RestaurantManagement\RestaurantManagement

# Use the modern Docker Compose plugin:
docker compose up -d --build
# (If your Docker CLI uses the legacy 'docker-compose' binary, run:)
docker-compose up -d --build# Restaurant Frontend

A minimal React + Vite frontend that talks to the Go backend.

Quick start:

```bash
cd frontend
npm install
# set the API base URL if backend uses different port
# Windows: set VITE_API_BASE_URL=http://localhost:8080 && npm run dev
# or use cross-env / .env
npm run dev
```

Defaults to `http://localhost:8080` for API requests. Adjust `VITE_API_BASE_URL` as needed.

Endpoints used by the frontend (adjust if your backend differs):
- `POST /login` — login returns `{ token: '...' }`
- `GET /menu` — returns menu items
- `GET /orders` — returns list of orders

If your backend uses different routes, update `src/api/client.js` and page components accordingly.
