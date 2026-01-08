# Setup Instructions

## Quick Start

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up Kalshi API credentials:**
   - Copy `backend/env.example` to `backend/.env`
   - Add your Kalshi API credentials:
     ```
     KALSHI_API_KEY=your_api_key_here
     KALSHI_PRIVATE_KEY=your_private_key_here
     KALSHI_ENVIRONMENT=demo
     ```

3. **Verify dependencies:**
   The Kalshi TypeScript SDK is already included in `package.json`:
   - Package: `kalshi-typescript` (v3.4.0+)
   - Database: `sql.js` (v1.13.0+) - SQLite compiled to WebAssembly
   - No additional installation needed after running `npm run install:all`

4. **Start the application:**
   ```bash
   npm run dev
   ```

## Getting Kalshi API Credentials

1. Create an account at [kalshi.com](https://kalshi.com)
2. Log in and navigate to Account Settings
3. Find the API section and generate new API keys
4. **Important:** Save the private key immediately - it's only shown once!

## Troubleshooting

### SDK Issues

The project uses `kalshi-typescript` v3.4.0+ which is already configured:
1. All API endpoints have been updated to match the latest Kalshi API
2. Authentication uses API key and private key PEM format
3. Check the official [Kalshi API documentation](https://docs.kalshi.com) for latest changes

### Connection Issues

- Ensure your API credentials are correct
- Check that `KALSHI_ENVIRONMENT` is set to `demo` for testing
- Verify your network connection
- Check backend logs for detailed error messages

### Database Issues

- The sql.js database (SQLite in WebAssembly) is created automatically
- Database initialization is async and happens on server startup
- Ensure the `backend/data/` directory is writable
- Delete `backend/data/orderflow.db` to reset the database
- No native compilation required - works on all platforms

## Development

- Backend runs on: `http://localhost:3001`
- Frontend runs on: `http://localhost:5173`
- WebSocket server: `ws://localhost:3001`

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set environment variables in your hosting platform

3. Start the backend:
   ```bash
   cd backend
   npm start
   ```

4. Serve the frontend build from `frontend/dist/`
