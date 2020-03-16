import { paths } from "./paths";
import qsTruthy from "../../utils/qs_truthy";

const PATHS_TO_SHOW = ["/actions/", "/device/", "/var/"];
const DELIMITER = "-----------------------------------";

const replacer = (k, v) => {
  if (typeof v === "number") {
    return `${v >= 0 ? "+" : ""}${v.toFixed(3)}`;
  }
  return v;
};
function describeCurrentMasks(userinput) {
  const strings = [];
  userinput.masked.forEach((maskers, i) => {
    let val;
    if (!userinput.actives[i]) return;
    if (maskers.length) {
      val = JSON.stringify(userinput.sortedBindings[i], replacer);
      strings.push(DELIMITER);
      strings.push(`Binding #${i}:`);
      if (val) val = val.replace(/{"(\w{3,})":/g, '{\n  "$1":').replace(/,"(\w{3,})":/g, ',\n  "$1":');
      strings.push(`${val}\n`);
    }
    maskers.forEach(masker => {
      val = JSON.stringify(userinput.sortedBindings[masker], replacer);
      if (val) val = val.replace(/{"(\w{3,})":/g, '{\n  "$1":').replace(/,"(\w{3,})":/g, ',\n  "$1":');
      strings.push(`- Masked by #${masker}:\n${val}`);
    });
    if (maskers.length) {
      strings.push(`\n`);
    }
  });
  return strings.join("\n");
}

AFRAME.registerSystem("userinput-debug", {
  active: true,

  tick() {
    if (!this.active) return;

    const userinput = AFRAME.scenes[0].systems.userinput;

    if (this.userinputFrameStatus) {
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

    if (userinput.get(paths.actions.debugUserInput.describeCurrentMasks)) {
      console.log(describeCurrentMasks(userinput));
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
      console.log("sorted", JSON.parse(JSON.stringify(userinput.sortedBindings)));
      console.log("actives", JSON.parse(JSON.stringify(userinput.actives)));
      console.log("masks", JSON.parse(JSON.stringify(userinput.masks)));
      console.log("masked", JSON.parse(JSON.stringify(userinput.masked)));
      console.log("devices", userinput.activeDevices);
      console.log("activeSets", JSON.parse(JSON.stringify(userinput.activeSets)));
      console.log("frame", JSON.parse(JSON.stringify(userinput.frame)));
      console.log("xformStates", userinput.xformStates);
      const { sortedBindings, actives, masked } = userinput;
      for (const i in sortedBindings) {
        const strings = [];
        if (masked[i].length > 0) {
          for (const j of masked[i]) {
            strings.push(JSON.stringify(sortedBindings[j]));
          }
        }

        if (this.logBindings) {
          console.log(
            "binding: ",
            i,
            "\n",
            JSON.parse(JSON.stringify(sortedBindings[i])),
            "\n",
            "dest: ",
            JSON.parse(JSON.stringify(sortedBindings[i].dest && Object.values(sortedBindings[i].dest))),
            "\n",
            "active: ",
            JSON.parse(JSON.stringify(actives[i])),
            "\n",
            "maskedBy: ",
            JSON.parse(JSON.stringify(masked[i])),
            "\n",
            strings.join("\n"),
            "\n"
          );
        }
      }
    }
  }
});
