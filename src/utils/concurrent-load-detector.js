// Detects if another instance of ConcurrentLoadDetector is start()'ed by in the same local storage
// context with the same instance key. Once a duplicate run is detected this will not fire any additional
// events.

const LOCAL_STORE_KEY = "___concurrent_load_detector";
import { EventTarget } from "event-target-shim";

export default class ConcurrentLoadDetector extends EventTarget {
  constructor(instanceKey) {
    super();

    this.interval = null;
    this.startedAt = null;
    this.instanceKey = instanceKey || "global";
  }

  start = () => {
    this.startedAt = new Date();
    localStorage.setItem(this.localStorageKey(), JSON.stringify({ started_at: this.startedAt }));

    // Check for concurrent load every second
    this.interval = setInterval(this._step, 1000);
  };

  stop = () => {
    if (this.interval) {
      clearInterval(this.interval);
    }
  };

  localStorageKey = () => {
    return `${LOCAL_STORE_KEY}_${this.instanceKey}`;
  };

  _step = () => {
    const currentState = JSON.parse(localStorage.getItem(this.localStorageKey()));
    const maxStartedAt = new Date(currentState.started_at);

    if (maxStartedAt.getTime() !== this.startedAt.getTime()) {
      this.dispatchEvent(new CustomEvent("concurrentload"));
      this.stop();
    }
  };
}
