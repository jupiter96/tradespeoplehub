# Trades Backend Server

Node.js/Express backend server for the Trades platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB connection string.

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Health Check
- `GET /api/health` - Returns server health status

## Project Structure

```
server/
├── routes/          # API route handlers
├── models/          # MongoDB models (to be added)
├── controllers/     # Business logic (to be added)
├── middleware/      # Custom middleware (to be added)
├── server.js        # Main server file
└── package.json     # Dependencies
```

