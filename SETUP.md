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

3. **Install Kalshi SDK:**
   The Kalshi TypeScript SDK package name may vary. Check the official Kalshi documentation for the correct package name:
   - Visit: https://docs.kalshi.com/sdks/overview
   - Install the TypeScript SDK in the backend directory:
     ```bash
     cd backend
     npm install @kalshi/kalshi-js
     # OR the package name might be different - check Kalshi docs
     ```

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

### SDK Installation Issues

If the `@kalshi/kalshi-js` package doesn't exist or has a different name:
1. Check the official Kalshi SDK documentation
2. The SDK might need to be installed from a different source
3. You may need to implement direct API calls using axios/fetch with RSA-PSS signing

### Connection Issues

- Ensure your API credentials are correct
- Check that `KALSHI_ENVIRONMENT` is set to `demo` for testing
- Verify your network connection
- Check backend logs for detailed error messages

### Database Issues

- The SQLite database is created automatically
- Ensure the `backend/data/` directory is writable
- Delete `backend/data/orderflow.db` to reset the database

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
