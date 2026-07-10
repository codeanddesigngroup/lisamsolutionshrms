import { io, type Socket } from "socket.io-client";

const apiUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

const SOCKET_URL = apiUrl.replace(/\/api\/?$/i, "");

let socket: Socket | null = null;

export const getChatSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }

  return socket;
};

export const connectChatSocket = () => {
  const client = getChatSocket();
  if (!client.connected) client.connect();
  return client;
};

export const disconnectChatSocket = () => {
  if (socket?.connected) socket.disconnect();
};

export default getChatSocket;
