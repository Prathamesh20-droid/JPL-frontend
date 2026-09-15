import { io } from "socket.io-client";

const host = window.location.hostname;
const defaultSocketUrl = `http://${host}:5000`;

const SOCKET_URL = (
  process.env.REACT_APP_SOCKET_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  defaultSocketUrl
).replace(/\/+$/, "");

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket"],
});

/**
 * Connect socket after successful login / auth refresh
 */
export const connectSocket = () => {
  if (!socket.connected) {
    console.log("🔌 Connecting socket...");
    socket.connect();
  }
};

/**
 * Disconnect socket on logout
 */
export const disconnectSocket = () => {
  if (socket.connected) {
    console.log("🔌 Disconnecting socket...");
    socket.disconnect();
  }
};
