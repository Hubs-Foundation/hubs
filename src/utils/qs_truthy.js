const qs = new URLSearchParams(location.search);

export default function qsTruthy(param) {
  const val = qs.get(param);
  // if the param exists but is not set (e.g. "?foo&bar"), its value is the empty string.
  return val === "" || /1|on|true|yes/i.test(val);
}

export function qsGet(param) {
  return qs.get(param);
}
