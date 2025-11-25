import './env.js';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from './services/passport.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import { ensureTestUser } from './utils/ensureTestUser.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI in your environment (.env)');
  process.exit(1);
}
const clientOriginEnv =
  process.env.CLIENT_ORIGIN || process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN_WHITELIST;
const parsedOrigins = clientOriginEnv
  ? clientOriginEnv
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];
const fallbackOrigins = isProduction ? [] : ['http://localhost:3000'];
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

// MongoDB connection
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    try {
      await ensureTestUser();
    } catch (seedError) {
      console.error('⚠️ Failed to seed sample user:', seedError);
    }
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// Serve static files from the React app build directory
const clientBuildPath = path.join(__dirname, './client/build');
const uploadsPath = path.join(__dirname, './uploads');
fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));
app.use(express.static(clientBuildPath));

// API catch-all handler: send back React's index.html file for any non-API routes
app.get('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Frontend will be served from ${clientBuildPath}`);
});

