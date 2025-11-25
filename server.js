import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from './services/passport.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import { ensureTestUser } from './utils/ensureTestUser.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI in your environment (.env)');
  // Don't exit in serverless - let Vercel handle it
  if (process.env.VERCEL !== '1') {
    process.exit(1);
  }
}

// CORS configuration
const clientOriginEnv =
  process.env.CLIENT_ORIGIN || process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN_WHITELIST;
const parsedOrigins = clientOriginEnv
  ? clientOriginEnv
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];
// Allow localhost ports in development
const fallbackOrigins = isProduction
  ? []
  : ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'];
const allowedOrigins = [...new Set([...parsedOrigins, ...fallbackOrigins])];

// Middleware
app.set('trust proxy', 1);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
      if (!origin) {
        return callback(null, true);
      }
      // If no origins are configured, allow all (development fallback)
      if (allowedOrigins.length === 0) {
        return callback(null, true);
      }
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn(`❌ CORS blocked request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'super-secret-session',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      collectionName: 'sessions',
      ttl: 60 * 60 * 24 * 30,
    }),
    cookie: {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Middleware to ensure MongoDB connection before API requests
app.use('/api', async (req, res, next) => {
  if (MONGODB_URI && mongoose.connection.readyState !== 1) {
    try {
      await connectMongoDB();
    } catch (error) {
      console.error('Failed to connect MongoDB in middleware:', error);
      // Continue anyway - some endpoints might not need DB
    }
  }
  next();
});

// MongoDB connection with serverless optimization
// Cache connection to reuse across function invocations
let cachedConnection = null;
let isConnecting = false;

const connectMongoDB = async () => {
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, wait for it
  if (isConnecting) {
    return new Promise((resolve, reject) => {
      const checkConnection = setInterval(() => {
        if (mongoose.connection.readyState === 1) {
          clearInterval(checkConnection);
          resolve(mongoose.connection);
        } else if (mongoose.connection.readyState === 0 && !isConnecting) {
          clearInterval(checkConnection);
          reject(new Error('Connection failed'));
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkConnection);
        reject(new Error('Connection timeout'));
      }, 30000);
    });
  }

  // Return cached connection if exists and valid
  if (cachedConnection && mongoose.connection.readyState !== 0) {
    return cachedConnection;
  }

  isConnecting = true;

  try {
    // Optimize connection options for serverless
    const isServerless = process.env.VERCEL === '1';
    const connectionOptions = {
      serverSelectionTimeoutMS: isServerless ? 10000 : 5000,
      socketTimeoutMS: isServerless ? 60000 : 45000,
      connectTimeoutMS: isServerless ? 30000 : 10000,
      maxPoolSize: isServerless ? 1 : 10, // Single connection for serverless
      minPoolSize: 0,
      maxIdleTimeMS: isServerless ? 30000 : 45000,
      retryWrites: true,
      retryReads: true,
    };

    const conn = await mongoose.connect(MONGODB_URI, connectionOptions);
    cachedConnection = conn;
    isConnecting = false;
    console.log('✅ MongoDB connected successfully');
    return conn;
  } catch (error) {
    isConnecting = false;
    cachedConnection = null;
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Handle connection events for better error recovery
if (MONGODB_URI) {
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    cachedConnection = null;
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
    cachedConnection = null;
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
  });

  const initializeDatabase = async () => {
    try {
      await connectMongoDB();
      await ensureTestUser();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Don't throw - allow server to start even if DB init fails
      // The connection will be retried on first request
    }
  };

  // Initialize database connection (non-blocking)
  initializeDatabase();
}

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// API catch-all handler
app.get('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve React build when running the full server (non-Vercel)
if (process.env.VERCEL !== '1') {
  const clientBuildPath = path.join(__dirname, 'build');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Start server (only if not in Vercel serverless environment)
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;
  const CLIENT_PORT = process.env.CLIENT_PORT || 3000;

  app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 Server is running!');
    console.log(`📡 Server Port: http://localhost:${PORT}`);
    console.log(`💻 Client Port: http://localhost:${CLIENT_PORT}`);
    console.log('═══════════════════════════════════════════════════════');
  });
}

// Export for Vercel serverless functions
export default app;