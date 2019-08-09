import { paths } from "./paths";
import qsTruthy from "../../utils/qs_truthy";

const PATHS_TO_SHOW = ["/actions/", "/device/", "/var/"];

AFRAME.registerSystem("userinput-debug", {
  active: true,

  tick() {
    if (!this.active) return;

    const userinput = AFRAME.scenes[0].systems.userinput;

    if (this.userinputFrameStatus) {
      const replacer = (k, v) => {
        if (typeof v === "number") {
          return `${v >= 0 ? "+" : ""}${v.toFixed(3)}`;
        }
        return v;
      };
      const pathsOutput = [];
      const { frame } = userinput;
      for (const key in frame.values) {
        if (!frame.get(key)) continue;
        if (!PATHS_TO_SHOW.some(x => key.startsWith(x))) continue;
        let val = JSON.stringify(frame.get(key), replacer);
        if (val) val = val.replace(/{"(\w{3,})":/g, '{\n  "$1":').replace(/,"(\w{3,})":/g, ',\n  "$1":');
        pathsOutput.push(`${key} -> ${val}`);
      }
      this.userinputFrameStatus.textContent = pathsOutput.join("\n");
    }

    if (userinput.get(paths.actions.logDebugFrame)) {
      if (qsTruthy("userinput_debug") && !this.userinputFrameStatus) {
        this.userinputFrameStatus = document.createElement("div");
        this.userinputFrameStatus.id = "userinput-frame-status";
        this.userinputFrameStatus.style = `
          position: absolute;
          z-index: 2;
          left: 0; bottom: 0;
          background: white;
          white-space: pre;
          font-family: monospace;
          font-size: 8pt;
        `;
        document.body.append(this.userinputFrameStatus);
      }

      console.log(userinput);
      console.log("sorted", userinput.sortedBindings);
      console.log("actives", userinput.actives);
      console.log("masks", userinput.masks);
      console.log("masked", userinput.masked);
      console.log("devices", userinput.activeDevices);
      console.log("activeSets", userinput.activeSets);
      console.log("frame", userinput.frame);
      console.log("xformStates", userinput.xformStates);
      const { sortedBindings, actives, masked } = userinput;
      for (const i in sortedBindings) {
        const sb = [];
        if (masked[i].length > 0) {
          for (const j of masked[i]) {
            sb.push(JSON.stringify(sortedBindings[j]));
          }
        }

        if (this.logBindings) {
          console.log(
            "binding: ",
            i,
            "\n",
            sortedBindings[i],
            "\n",
            "dest: ",
            sortedBindings[i].dest && Object.values(sortedBindings[i].dest),
            "\n",
            "active: ",
            actives[i],
            "\n",
            "maskedBy: ",
            masked[i],
            "\n",
            sb.join("\n"),
            "\n"
          );
        }
      }
    }
  }
});
