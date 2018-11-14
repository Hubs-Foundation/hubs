import { paths } from "./paths";
AFRAME.registerSystem("userinput-debug", {
  active: true,

  tick() {
    if (!this.active) {
      return;
    }
    const userinput = AFRAME.scenes[0].systems.userinput;
    if (userinput.get(paths.actions.logDebugFrame)) {
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
