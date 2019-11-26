const qs = new URLSearchParams(location.hash.split("?")[1]);
const IDLE_TIMEOUT_MS = (parseInt(qs.get("idle_timeout"), 10) || 1 * 60 * 60) * 1000;
let idleTimeout;

function resetTimeout() {
  if (idleTimeout) clearTimeout(idleTimeout);
  idleTimeout = setTimeout(() => window.dispatchEvent(new CustomEvent("idle_detected")), IDLE_TIMEOUT_MS);
  window.dispatchEvent(new CustomEvent("activity_detected"));
}

export function detectIdle() {
  const events = ["click", "pointerdown", "touchstart", "keydown"];

  for (const event of events) {
    window.addEventListener(event, resetTimeout);
  }

  resetTimeout();
}
