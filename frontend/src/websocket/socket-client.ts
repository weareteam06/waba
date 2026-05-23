"use client";

import { io, type Socket } from "socket.io-client";
import { currentAccessToken } from "@/lib/api-client";

let socket: Socket | null = null;

export function getSocket() {
  if (socket) return socket;
  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!url) return null;
  socket = io(url, {
    transports: ["websocket"],
    autoConnect: false,
    auth: () => ({ token: currentAccessToken() }),
  });
  return socket;
}
