// Stores a key in localStorage and registeres a listener for the same key being set (by another tab).
// When detected, fire a "concurrentload" event.
export default function detectConcurrentLoad(instanceKey = "global") {
  const key = `___concurrent_load_detector_${instanceKey}`;
  localStorage.setItem(key, JSON.stringify({ started_at: new Date() }));
  const onStorageEvent = e => {
    if (e.key !== key) return;
    window.dispatchEvent(new CustomEvent("concurrentload"));
    window.removeEventListener("storage", onStorageEvent);
  };
  window.addEventListener("storage", onStorageEvent);
}
