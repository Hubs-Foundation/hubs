import configs from "../utils/configs";
import { pushHistoryPath, withSlug } from "../utils/history";
import { hasReticulumServer } from "../utils/phoenix-utils";

export function navigateToClientInfo(history, clientId) {
  const currentParams = new URLSearchParams(history.location.search);

  if (hasReticulumServer() && document.location.host !== configs.RETICULUM_SERVER) {
    currentParams.set("client_id", clientId);
    pushHistoryPath(history, history.location.pathname, currentParams.toString());
  } else {
    pushHistoryPath(history, withSlug(history.location, `/clients/${clientId}`), currentParams.toString());
  }
}
