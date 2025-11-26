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
import adminRoutes from './routes/admin.js';
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

// MongoDB connection with serverless optimization
// Cache connection to reuse across function invocations
let cachedConnection = null;

const connectMongoDB = async () => {
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Return cached connection if exists
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    cachedConnection = conn;
    console.log('✅ MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

const initializeDatabase = async () => {
  await connectMongoDB();
  await ensureTestUser();
};


if (MONGODB_URI) {
  initializeDatabase().catch((error) => {
    console.error('Failed to initialize database:', error);
  });
}

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

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