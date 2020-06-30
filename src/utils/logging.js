// A-Frame blows away any npm debug log filters so this allow the user to set the log filter
// via the query string.
import debug from "debug";
import qsTruthy from "./qs_truthy";

const qs = new URLSearchParams(location.search);
const isDebug = qsTruthy("debug");
const logFilter = qs.get("log_filter") || (isDebug && "naf-janus-adapter:*,naf-dialog-adapter:*,mediasoup*");

if (logFilter) {
  debug.enable(logFilter);
}
