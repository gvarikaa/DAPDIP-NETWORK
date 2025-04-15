// src/providers/SocketProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useUser } from "@clerk/nextjs";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    // ერთი საერთო სოკეტის ინსტანცია მთელი აპლიკაციისთვის
    const socketInstance = io();

    socketInstance.on("connect", () => {
      console.log("Socket connected!");
      setIsConnected(true);
      
      // ემიტი მხოლოდ წარმატებული დაკავშირების შემდეგ
      if (user?.username) {
        socketInstance.emit("newUser", user.username);
      }
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected!");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      console.log("Cleaning up socket connection");
      socketInstance.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);