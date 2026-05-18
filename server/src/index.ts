import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { initDatabase } from './database';
import { sessionRouter } from './routes/sessions';
import { playerRouter } from './routes/players';
import { transactionRouter, setTransactionIO } from './routes/transactions';
import { setupSocket } from './socket';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
setTransactionIO(io);

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/sessions', sessionRouter);
app.use('/api/players', playerRouter);
app.use('/api/transactions', transactionRouter);

// Serve client in production
const clientPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientPath, 'index.html'));
  }
});

// Socket.IO
setupSocket(io);

export { io };

const PORT = process.env.PORT || 3001;

initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🏦 Monopoly Bank rodando na porta ${PORT}`);
  });
}).catch(err => {
  console.error('❌ Erro ao conectar no banco:', err);
});
