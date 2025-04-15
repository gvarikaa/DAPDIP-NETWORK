import { Server } from 'socket.io';

export default function SocketHandler(req, res) {
  if (res.socket.server.io) {
    console.log('Socket.IO უკვე გაშვებულია');
    res.end();
    return;
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log('ახალი მომხმარებელი დაკავშირდა:', socket.id);
    
    socket.on('newUser', (username) => {
      console.log(`მომხმარებელი ${username} დაკავშირდა`);
    });
    
    socket.on('disconnect', () => {
      console.log('მომხმარებელი გაითიშა');
    });
  });

  console.log('Socket.IO სერვერი გაეშვა');
  res.end();
}