import qsTruthy from "./qs_truthy";

const showLog = qsTruthy("debug_log");

if (showLog) {
  const template = document.createElement("template");
  template.innerHTML = `
    <style>
      #debug-log {
        position: absolute;
        top: 13em;
        background: white;
        opacity: 0.7;
        z-index: 1000;
      }
      #debug-log, #debug-log-input {
        font-family: monospace;
        font-size: 11px;
        width: 100%;
      }

      #debug-log-controls {
        display: flex;
        padding: 0.2em;
      }

      #debug-log-eval {
        display: flex;
        flex: 1;
      }

      #debug-log-log {
        overflow: auto;
        height: 30vh;
      }
      #debug-log-log.minimized {
        height: auto;
      }
      #debug-log-log.minimized .entry {
        display: none;
      }
      #debug-log-log.minimized .entry:last-child {
        display: block;
      }
      #debug-log-log .entry {
        border: 1px solid grey;
        margin: 0.2em;
        padding: 0.2em;
      }
      #debug-log-log .entry.error { background-color: pink; }
      #debug-log-log .entry.warn { background-color: orange; }
    </style>
    <div id="debug-log">
        <div id="debug-log-controls">
          <form id="debug-log-eval">
            <input id="debug-log-input" placeholder="&gt;&gt;" autocorrect="off" autocapitalize="none" />
            <button>&gt;</button>
          </form>
          <button id="debug-log-minimize">_</button>
        </div>
        <div id="debug-log-log"></div>
    </div>
  `;

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(template.content);
  });

  const debugLog = template.content.querySelector("#debug-log-log");
  debugLog.addEventListener("wheel", e => e.stopPropagation());

  const debugLogInput = template.content.querySelector("#debug-log-input");
  const debugLogEval = template.content.querySelector("#debug-log-eval");
  debugLogEval.onsubmit = e => {
    e.preventDefault();
    console.log(eval(`(${debugLogInput.value})`));
  };

  let minimized = false;
  const debugLogMinimize = template.content.querySelector("#debug-log-minimize");
  debugLogMinimize.onclick = () => {
    minimized = !minimized;
    debugLog.className = minimized ? "minimized" : "";
    debugLog.scrollTop = debugLog.scrollHeight - debugLog.clientHeight;
  };

  const origConsoleInfo = console.info;
  const origConsoleLog = console.log;
  const origConsoleError = console.error;
  const origConsoleWarn = console.warn;

  const log = function(className, objs) {
    let entry;
    if (debugLog.childNodes.length > 1000) {
      entry = debugLog.firstChild;
    } else {
      entry = document.createElement("div");
      entry.classList.add("entry");
    }
    entry.classList.remove("warn", "error");
    entry.classList.add(className);

    const arr = Array.from(objs);
    const firstObj = arr[0];
    let content;
    if (typeof firstObj === "string" && firstObj.includes("%c")) {
      content = firstObj.replace(/%c/g, "");
    } else if (firstObj instanceof Error) {
      content = `${firstObj.message}\n${firstObj.stack}`;
    } else {
      content = arr
        .map(obj => {
          if (typeof obj === "string") return obj;
          return JSON.stringify(obj);
        })
        .join(" ");
    }

    const time = new Date().toISOString().substring(11, 23);
    entry.textContent = `[${time}] ${content}`;

    const shouldScroll = debugLog.scrollTop === debugLog.scrollHeight - debugLog.clientHeight;
    debugLog.append(entry);
    if (shouldScroll) debugLog.scrollTop = debugLog.scrollHeight - debugLog.clientHeight;
  };

  console.warn = function() {
    origConsoleWarn.apply(null, arguments);
    log("warn", arguments);
  };

  console.error = function() {
    origConsoleError.apply(null, arguments);
    log("error", arguments);
  };

  console.log = function() {
    origConsoleLog.apply(null, arguments);
    log("log", arguments);
  };

  console.info = function() {
    origConsoleInfo.apply(null, arguments);
    log("info", arguments);
  };

  window.onunhandledrejection = e => log("error", [e.reason.message, e.reason.code, e.reason.name]);
  window.onerror = e => log("error", [e]);
}
