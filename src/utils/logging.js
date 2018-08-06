// A-Frame blows away any npm debug log filters so this allow the user to set the log filter
// via the query string.
import debug from "debug";

const qs = new URLSearchParams(location.search);

function qsTruthy(param) {
  const val = qs.get(param);
  // if the param exists but is not set (e.g. "?foo&bar"), its value is the empty string.
  return val === "" || /1|on|true/i.test(val);
}

const isDebug = qsTruthy("debug");
const logFilter = qs.get("log_filter") || (isDebug && "naf-janus-adapter:*");

if (logFilter) {
  debug.enable(logFilter);
}
