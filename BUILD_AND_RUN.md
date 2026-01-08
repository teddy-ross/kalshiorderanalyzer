# Build and Run Instructions

## Prerequisites

- Node.js 18+ and npm
- Kalshi API credentials (API key and private key)

## Setup Steps

### 1. Install Dependencies

```bash
npm run install:all
```

This installs dependencies for:
- Root project (concurrently for running both servers)
- Backend (Express, SQLite, Kalshi SDK, etc.)
- Frontend (React, Vite, etc.)

### 2. Set Up Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp env.example .env
```

Edit `backend/.env` and add your Kalshi API credentials:

```
KALSHI_API_KEY=your_api_key_here
KALSHI_PRIVATE_KEY=your_private_key_here
KALSHI_ENVIRONMENT=demo
PORT=3001
CORS_ORIGIN=http://localhost:5173
DB_PATH=./data/orderflow.db
```

**Getting Kalshi API Credentials:**
1. Create an account at [kalshi.com](https://kalshi.com)
2. Log in and navigate to Account Settings
3. Find the API section and generate new API keys
4. **Important:** Save the private key immediately - it's only shown once!

### 3. Run the Application

**Development mode (runs both backend and frontend):**
```bash
npm run dev
```

This will:
- Start the backend server on `http://localhost:3001`
- Start the frontend dev server on `http://localhost:5173`
- Open your browser to `http://localhost:5173`

**Run backend only:**
```bash
npm run dev:backend
```

**Run frontend only:**
```bash
npm run dev:frontend
```

## Building for Production

### Build both backend and frontend:
```bash
npm run build
```

### Start production backend:
```bash
cd backend
npm start
```

The frontend build will be in `frontend/dist/` - serve it with any static file server.

## Troubleshooting

### SDK Issues
If you encounter errors about missing Kalshi SDK packages:
- The project uses `kalshi-typescript` package (already in dependencies)
- If methods don't match, check the [Kalshi API documentation](https://docs.kalshi.com/sdks/overview)

### Database Issues
- The SQLite database is created automatically at `backend/data/orderflow.db`
- Ensure the `backend/data/` directory is writable
- Delete `backend/data/orderflow.db` to reset the database

### Connection Issues
- Ensure your API credentials are correct in `backend/.env`
- Check that `KALSHI_ENVIRONMENT` is set to `demo` for testing
- Verify your network connection
- Check backend console logs for detailed error messages

### Port Conflicts
- Backend default port: `3001` (change in `backend/.env`)
- Frontend default port: `5173` (Vite will auto-increment if busy)

## Project Structure

```
├── backend/          # Express API server
│   ├── src/
│   │   ├── database/ # SQLite database schema
│   │   ├── services/ # Kalshi API service & order flow monitor
│   │   ├── routes/   # API routes
│   │   └── index.ts  # Server entry point
│   └── .env          # Environment variables (create this)
├── frontend/         # React frontend
│   └── src/
│       ├── components/ # React components
│       ├── hooks/      # React hooks (WebSocket)
│       └── services/   # API client
└── package.json       # Root package.json with scripts
```

## API Endpoints

Once running, the backend exposes:

- `GET /api/order-flows` - Get recent order flows
- `GET /api/markets` - List available markets
- `GET /api/markets/:ticker` - Get market details
- `GET /api/markets/:ticker/orderbook` - Get order book
- `GET /api/markets/:ticker/trades` - Get recent trades
- `GET /api/markets/:ticker/stats` - Get market statistics
- `GET /health` - Health check endpoint

WebSocket server runs on `ws://localhost:3001` for real-time order flow updates.
