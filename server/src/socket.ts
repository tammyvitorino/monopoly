import { Server, Socket } from 'socket.io';

export function setupSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Conectado: ${socket.id}`);

    socket.on('join-session', (sessionCode: string) => {
      socket.join(sessionCode);
      console.log(`👤 ${socket.id} entrou na sala ${sessionCode}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Desconectado: ${socket.id}`);
    });
  });
}

export function emitToSession(io: Server, sessionCode: string, event: string, data: any) {
  io.to(sessionCode).emit(event, data);
}
