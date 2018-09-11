import uuid from "uuid/v4";
import { Socket } from "phoenix";

export function connectToReticulum() {
  const qs = new URLSearchParams(location.search);

  const socketProtocol = qs.get("phx_protocol") || (document.location.protocol === "https:" ? "wss:" : "ws:");
  let socketHost = qs.get("phx_host");
  let socketPort = qs.get("phx_port");

  if (process.env.RETICULUM_SERVER) {
    const [retHost, retPort] = process.env.RETICULUM_SERVER.split(":");
    socketHost = socketHost || retHost || "";
    socketPort = socketPort || retPort || "443";
  } else {
    socketHost = socketHost || document.location.hostname || "";
    socketPort = socketPort || document.location.port || "443";
  }

  const socketUrl = `${socketProtocol}//${socketHost}${socketPort ? `:${socketPort}` : ""}/socket`;
  console.log(`Phoenix Socket URL: ${socketUrl}`);

  const socket = new Socket(socketUrl, { params: { session_id: uuid() } });
  socket.connect();

  return socket;
}

export function getReticulumFetchUrl(path) {
  if (process.env.RETICULUM_SERVER) {
    return `https://${process.env.RETICULUM_SERVER}${path}`;
  } else {
    return path;
  }
}
