import uuid from "uuid/v4";
import { Socket } from "phoenix";

export function connectToReticulum(debug = false) {
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

  const socketSettings = {
    params: { session_id: uuid() }
  };

  if (debug) {
    socketSettings.logger = (kind, msg, data) => {
      console.log(`${kind}: ${msg}`, data);
    };
  }

  const socket = new Socket(socketUrl, socketSettings);
  socket.connect();

  return socket;
}

const resolverLink = document.createElement("a");
export function getReticulumFetchUrl(path, absolute = false) {
  if (process.env.RETICULUM_SERVER) {
    return `https://${process.env.RETICULUM_SERVER}${path}`;
  } else if (absolute) {
    resolverLink.href = path;
    return resolverLink.href;
  } else {
    return path;
  }
}

export function getLandingPageForPhoto(photoUrl) {
  const parsedUrl = new URL(photoUrl);
  return getReticulumFetchUrl(parsedUrl.pathname.replace(".png", ".html") + parsedUrl.search, true);
}
