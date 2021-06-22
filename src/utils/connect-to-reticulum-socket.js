import { getReticulumFetchUrl } from "./phoenix-utils";
import configs from "./configs";

async function fetchReticulumMeta() {
  return await fetch(getReticulumFetchUrl("/api/v1/meta")).then(r => r.json());
}

export async function getReticulumSocketUrl() {
  const qs = new URLSearchParams(location.search);
  const meta = fetchReticulumMeta();
  console.log(await meta);
  const host = qs.get("phx_host") || configs.RETICULUM_SOCKET_SERVER || (await meta).phx_host;
  const port =
    qs.get("phx_port") ||
    (!!configs.RETICULUM_SOCKET_SERVER && new URL(`${document.location.protocol}//${configs.RETICULUM_SERVER}`).port) ||
    "443";
  const protocol =
    qs.get("phx_protocol") ||
    configs.RETICULUM_SOCKET_PROTOCOL ||
    (document.location.protocol === "https:" ? "wss:" : "ws:");
  const maybePort = port ? `:${port}` : "";

  return `${protocol}//${host}${maybePort}`;
}
