import './env.js';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from './services/passport.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';

// Load environment variables
dotenv.config();

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
const fallbackOrigins = isProduction ? [] : ['http://localhost:5000'];
const allowedOrigins = [...new Set([...parsedOrigins, ...fallbackOrigins])];

// Middleware
app.set('trust proxy', 1);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
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
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    cachedConnection = conn;
    console.log('✅ MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Initialize MongoDB connection
if (MONGODB_URI) {
  connectMongoDB().catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
  });
}

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// API catch-all handler
app.get('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Export for Vercel serverless functions
export default app;