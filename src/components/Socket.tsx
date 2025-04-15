"use client";
import { useEffect, useState } from "react";
import { getSocket } from "../socket";
import { useUser } from "@clerk/nextjs";

export default function Socket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const { user } = useUser();

  useEffect(() => {
    const setupSocket = async () => {
      const socketInstance = await getSocket();
      setSocket(socketInstance);
    };

    setupSocket();
  }, []);

  useEffect(() => {
    if (!socket) return;

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
      
      if (user) {
        socket.emit("newUser", user.username);
      }
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    if (socket.connected) {
      onConnect();
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket, user]);

  return (
    <div>
      {isConnected ? (
        <p>Connected via {transport} transport.</p>
      ) : (
        <p>Disconnected from the server.</p>
      )}
    </div>
  );
}