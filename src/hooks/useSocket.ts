// src/hooks/useSocket.ts
"use client";
import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/types";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socketInstance: AppSocket | null = null;

export function useSocket(userId?: string) {
  const socketRef = useRef<AppSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    if (!socketInstance) {
      socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
        transports: ["websocket"],
        autoConnect: true,
      });
    }

    socketRef.current = socketInstance;
    socketInstance.emit("join:room", userId);

    return () => {
      // don't disconnect on unmount — keep alive
    };
  }, [userId]);

  const on = useCallback(
    <E extends keyof ServerToClientEvents>(
      event: E,
      handler: ServerToClientEvents[E]
    ) => {
      socketRef.current?.on(event as string, handler as (...args: any[]) => void);
      return () => {
        socketRef.current?.off(event as string, handler as (...args: any[]) => void);
      };
    },
    []
  );

  const emit = useCallback(
    <E extends keyof ClientToServerEvents>(
      event: E,
      ...args: Parameters<ClientToServerEvents[E]>
    ) => {
      socketRef.current?.emit(event, ...args);
    },
    []
  );

  return { socket: socketRef.current, on, emit };
}
