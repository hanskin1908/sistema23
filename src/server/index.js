import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database(process.env.NODE_ENV === 'production' 
  ? '/tmp/database.sqlite'
  : join(__dirname, 'database.sqlite'), (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Database connected');
    createTables();
  }
});

function createTables() {
  // ... (código existente para crear tablas)
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running' });
});

// ... (otras rutas existentes)

// Socket.io
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('A user connected');

  // ... (código existente para manejar eventos de socket)
});

httpServer.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});