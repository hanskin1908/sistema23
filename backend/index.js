import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

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
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS estudiantes (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        grado INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS materias (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notas (
        id SERIAL PRIMARY KEY,
        estudiante_id INTEGER REFERENCES estudiantes(id),
        materia_id INTEGER REFERENCES materias(id),
        nota REAL NOT NULL
      );
    `);
    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables', err);
  } finally {
    client.release();
  }
}

createTables();

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running' });
});

app.get('/api/estudiantes/:id/notas', async (req, res) => {
  const estudianteId = req.params.id;
  try {
    const result = await pool.query(`
      SELECT m.nombre as materia, n.nota
      FROM notas n
      JOIN materias m ON n.materia_id = m.id
      WHERE n.estudiante_id = $1
    `, [estudianteId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.io
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', ({ roomId, userId, username }) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    rooms.get(roomId).set(userId, { username, socketId: socket.id });
    
    io.to(roomId).emit('updateUserList', Array.from(rooms.get(roomId).values()));
    socket.to(roomId).emit('userJoined', { userId, username });
    
    console.log(`User ${username} (${userId}) joined room ${roomId}`);
  });

  socket.on('sendMessage', ({ roomId, message }) => {
    io.to(roomId).emit('message', message);
  });

  socket.on('videoStarted', ({ roomId, userId }) => {
    socket.to(roomId).emit('userStartedVideo', { userId });
  });

  socket.on('videoEnded', ({ roomId, userId }) => {
    socket.to(roomId).emit('userEndedVideo', { userId });
  });

  socket.on('offer', ({ roomId, targetUserId, offer }) => {
    socket.to(roomId).emit('offer', { fromUserId: socket.id, offer });
  });

  socket.on('answer', ({ roomId, targetUserId, answer }) => {
    socket.to(roomId).emit('answer', { fromUserId: socket.id, answer });
  });

  socket.on('ice-candidate', ({ roomId, targetUserId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', { fromUserId: socket.id, candidate });
  });

  socket.on('disconnect', () => {
    rooms.forEach((users, roomId) => {
      users.forEach((user, userId) => {
        if (user.socketId === socket.id) {
          users.delete(userId);
          console.log(`User ${user.username} (${userId}) left room ${roomId}`);
          
          io.to(roomId).emit('updateUserList', Array.from(users.values()));
          socket.to(roomId).emit('userLeft', { userId });
          
          if (users.size === 0) {
            rooms.delete(roomId);
          }
        }
      });
    });
  });
});

httpServer.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});