import uuid from "uuid/v4";
import { Socket } from "phoenix";

export function connectToReticulum() {
  const qs = new URLSearchParams(location.search);

  const socketProtocol = qs.get("phx_protocol") || (document.location.protocol === "https:" ? "wss:" : "ws:");
  const [retHost, retPort] = (process.env.DEV_RETICULUM_SERVER || "").split(":");
  const isProd = process.env.NODE_ENV === "production";
  const socketPort = qs.get("phx_port") || (isProd ? document.location.port : retPort) || "443";
  const socketHost = qs.get("phx_host") || (isProd ? document.location.hostname : retHost) || "";
  const socketUrl = `${socketProtocol}//${socketHost}${socketPort ? `:${socketPort}` : ""}/socket`;
  console.log(`Phoenix Socket URL: ${socketUrl}`);

  const socket = new Socket(socketUrl, { params: { session_id: uuid() } });
  socket.connect();

  return socket;
}
