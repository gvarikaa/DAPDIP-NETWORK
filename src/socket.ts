"use client";
import { io } from "socket.io-client";

// ცდით დაკავშირებას ზუსტ მისამართზე სადაც უნდა იყოს სერვერი
// ეს უნდა იყოს იგივე მისამართი სადაც გაქვთ API სერვერი
export const socket = io("http://localhost:3000", {
  path: "/api/socketio",
  autoConnect: true,
  transports: ["polling", "websocket"],
  reconnectionAttempts: 5,
});