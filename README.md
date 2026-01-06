# Kalshi Order Flow Monitor

A full-stack application for monitoring order flows on the Kalshi prediction market platform.

## Features

- Real-time order flow monitoring via WebSocket
- Historical order flow data storage (SQLite database)
- Interactive dashboard with live updates
- Market data visualization
- Order book tracking
- Market statistics and analytics

## Prerequisites

- Node.js 18+ and npm
- Kalshi API credentials (API key and private key)

## Setup

1. **Install dependencies:**
```bash
npm run install:all
```

2. **Install Kalshi SDK:**
   ```bash
   cd backend
   npm install @kalshi/kalshi-js
   ```
   *Note: If the package name differs, check [Kalshi SDK documentation](https://docs.kalshi.com/sdks/overview)*

3. **Configure environment variables:**
   - Copy `backend/env.example` to `backend/.env`
   - Add your Kalshi API credentials:
     ```
     KALSHI_API_KEY=your_api_key_here
     KALSHI_PRIVATE_KEY=your_private_key_here
     KALSHI_ENVIRONMENT=demo  # Use 'demo' for testing, 'prod' for production
     ```

4. **Run the application:**
```bash
npm run dev
```

The backend will run on `http://localhost:3001` and the frontend on `http://localhost:5173`.

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── database/        # SQLite database schema and operations
│   │   ├── services/        # Kalshi API service and order flow monitor
│   │   ├── routes/          # API routes
│   │   └── index.ts         # Express server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API client
│   │   ├── hooks/           # React hooks (WebSocket)
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## API Configuration

You'll need to:
1. Create a Kalshi account at [kalshi.com](https://kalshi.com)
2. Navigate to Account Settings
3. Generate API keys (API key and private key)
4. Add credentials to `backend/.env`

**Note:** The private key is only shown once, so save it securely!

## API Endpoints

### Order Flows
- `GET /api/order-flows` - Get recent order flows
- `GET /api/order-flows/range` - Get order flows by time range
- `GET /api/markets/:ticker/stats` - Get market statistics

### Markets
- `GET /api/markets` - List available markets
- `GET /api/markets/:ticker` - Get market details
- `GET /api/markets/:ticker/orderbook` - Get order book
- `GET /api/markets/:ticker/trades` - Get recent trades

### Monitoring
- `GET /api/monitor/markets` - Get monitored markets
- `POST /api/monitor/markets/:ticker` - Add market to monitor
- `DELETE /api/monitor/markets/:ticker` - Remove market from monitor

## Development

- **Backend only:** `npm run dev:backend`
- **Frontend only:** `npm run dev:frontend`
- **Build:** `npm run build`

## Database

The application uses SQLite to store order flow data. The database file is created automatically at `backend/data/orderflow.db`.

## Security

**Important:** All sensitive files are automatically ignored by git:
- `.env` files (containing API keys)
- Database files (`*.db`, `*.sqlite*`)
- Private keys (`*.key`, `*.pem`, etc.)
- The `data/` directory

Never commit API keys, private keys, or database files to version control. The `.gitignore` file is configured to protect these files automatically.

## License

MIT
