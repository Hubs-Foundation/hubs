import { paths } from "./paths";
const line = "__________________________________________________________________";
const bindingToString = b => {
  const sb = [];
  sb.push("{\n");
  sb.push("  ");
  sb.push("src: ");
  sb.push("\n");
  for (const s of Object.keys(b.src)) {
    sb.push("  ");
    sb.push("  ");
    sb.push(s);
    sb.push(" : ");
    sb.push(b.src[s]);
    sb.push("\n");
  }
  sb.push("  ");
  sb.push("dest: ");
  sb.push("\n");
  for (const s of Object.keys(b.dest)) {
    sb.push("  ");
    sb.push("  ");
    sb.push(s);
    sb.push(" : ");
    sb.push(b.dest[s]);
    sb.push("\n");
  }
  sb.push("  ");
  sb.push("priority");
  sb.push(" : ");
  sb.push(b.priority || 0);
  for (const s of b.sets) {
    sb.push("\n");
    sb.push("  ");
    sb.push("in set");
    sb.push(" : ");
    sb.push(s);
    sb.push("\n");
  }
  sb.push("\n");
  sb.push("}\n");
  return sb.join("");
};
AFRAME.registerSystem("userinput-debug", {
  tick() {
    const userinput = AFRAME.scenes[0].systems.userinput;
    if (userinput.get(paths.actions.logDebugFrame) || userinput.get(paths.actions.log)) {
      const sb = [];
      sb.push("\n");
      sb.push(line);
      sb.push("\n");
      sb.push("actives:");
      sb.push("\n");
      sb.push(line);
      sb.push("\n");
      for (let i = 0; i < userinput.runners.length; i++) {
        if (userinput.actives[i]) {
          sb.push(bindingToString(userinput.runners[i]));
        }
      }
      sb.push("\n");
      sb.push(line);
      sb.push("\n");
      sb.push("inactives:");
      sb.push("\n");
      sb.push(line);
      sb.push("\n");
      for (let i = 0; i < userinput.runners.length; i++) {
        if (!userinput.actives[i]) {
          sb.push("\n");
          sb.push("The inactive binding:\n");
          sb.push(bindingToString(userinput.runners[i]));
          sb.push("\n");
          sb.push("is overridden by the following ");
          sb.push(userinput.overrides[i].length);
          sb.push(" bindings.\n");
          for (const o of userinput.overrides[i]) {
            sb.push("\n");
            sb.push("Override:\n");
            sb.push(bindingToString(o));
            sb.push("\n");
          }
        }
      }
      console.log("active and inactive bindings");
      console.log(sb.join(""));
      console.log("runners", userinput.runners);
      console.log("actives", userinput.actives);
      console.log("xformStates", userinput.xformStates);
      console.log("devices", userinput.activeDevices);
      console.log("map", userinput.map);
      console.log("activeSets", userinput.activeSets);
      console.log("frame", userinput.frame);
    }
  }
});
