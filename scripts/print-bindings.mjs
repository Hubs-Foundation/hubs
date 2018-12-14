import { paths } from "../msrc/src/systems/userinput/paths";

function capitalize(str) {
  return str && str[0].toUpperCase() + str.substring(1);
}

function fromCamelCase(str) {
  return capitalize(str.replace(/([^A-Z])([A-Z])/g, "$1 $2").toLowerCase());
}

function pretty(str) {
  const words = fromCamelCase(str)
    .replace(/keyboard-var/, "keyboard")
    .replace(/rising/, "pressed")
    .replace(/falling/, "released")
    .split("/")
    .slice(2);
  words[0] = capitalize(words[0]);
  return words.join(" ");
}

function quoteLast(sentence) {
  const words = sentence.split(" ");
  return `${words[0]} "${words.slice(1).join(" ")}"`;
}

function rightPad(str, len) {
  return str + new Array(Math.max(0, len - str.length)).join(" ");
}

function getSources(src) {
  if (src instanceof Array) {
    return src;
  } else {
    return Object.values(src);
  }
}

const excludeXforms = ["copy", "rising", "any", "max_vec2", "compose_vec2", "scale"];

function getPaths(set, dest) {
  const paths = [];
  for (const binding of set) {
    if (!(binding.dest && binding.dest.value)) continue;
    if (!binding.src) continue;
    if (binding.dest.value === dest) {
      if (!excludeXforms.includes(binding.xform.name)) paths.push(binding.xform.name);
      for (const src of getSources(binding.src)) {
        const subPaths = getPaths(set, src);
        if (subPaths) paths.push(subPaths);
      }
    }
  }
  if (paths.length === 0) {
    return pretty(dest)
  }
  if (paths.length === 1 && typeof paths[0] === "string") {
    return paths[0];
  }
  return paths;
}

const exclude = [
  paths.actions.cameraDelta,
  paths.actions.cursor.pose,
  paths.actions.cursor.modDelta,
  paths.actions.cursor.stopDrawing,
  paths.actions.leftHand.index,
  paths.actions.leftHand.middleRingPinky,
  paths.actions.leftHand.pose,
  paths.actions.leftHand.stopDrawing,
  paths.actions.leftHand.stopTeleport,
  paths.actions.leftHand.thumb,
  paths.actions.rightHand.index,
  paths.actions.rightHand.middleRingPinky,
  paths.actions.rightHand.pose,
  paths.actions.rightHand.stopDrawing,
  paths.actions.rightHand.stopTeleport,
  paths.actions.rightHand.thumb,
  paths.actions.stopGazeTeleport,
  paths.actions.thaw
];

function formatSources(sources) {
  if (sources.length === 1 && typeof sources[0] === "string") {
    return "      " + sources[0];
  } else {
    return JSON.stringify(sources, null, 2)
      .split("\n")
      .map(x => "      " + x)
      .join("\n");
  }
}

function printSet(set) {
  for (const binding of set) {
    if (!(binding.dest && binding.dest.value)) continue;
    const dest = binding.dest.value;
    if (!dest.includes("/actions/") || exclude.includes(dest)) continue;
    if (!binding.src) continue;
    console.log(
      "\n    " + pretty(binding.dest.value),
      "\n" +
        (excludeXforms.includes(binding.xform.name) ? "" : "      " + binding.xform.name + "\n") +
        formatSources(getSources(binding.src).map(src => getPaths(set, src)))
    );
  }
}

function printBindings(bindingsName, bindings) {
  console.log("\n" + fromCamelCase(bindingsName));
  for (const setName in bindings) {
    console.log("\n  <" + fromCamelCase(setName) + ">");
    printSet(bindings[setName]);
  }
}

/*/
import { touchscreenUserBindings } from "../msrc/src/systems/userinput/bindings/touchscreen-user";
printBindings("touchscreenUserBindings", touchscreenUserBindings);
//*/

/*/
import { keyboardMouseUserBindings } from "../msrc/src/systems/userinput/bindings/keyboard-mouse-user";
printBindings("keyboardMouseUserBindings", keyboardMouseUserBindings);
//*/

//*/
import { oculusTouchUserBindings } from "../msrc/src/systems/userinput/bindings/oculus-touch-user";
printBindings("oculusTouchUserBindings", oculusTouchUserBindings);
//*/

/*/
import { viveUserBindings } from "../msrc/src/systems/userinput/bindings/vive-user";
printBindings("viveUserBindings", viveUserBindings);
//*/

import generate3DOFTriggerBindings from "../msrc/src/systems/userinput/bindings/oculus-go-user";
/*/
const oculusGoUserBindings = generate3DOFTriggerBindings(paths.device.oculusgo);
printBindings("oculusGoUserBindings", oculusGoUserBindings);
//*/

/*/
import { daydreamUserBindings } from "../msrc/src/systems/userinput/bindings/daydream-user";
printBindings("daydreamUserBindings", daydreamUserBindings);
//*/

/*/
import { xboxControllerUserBindings } from "../msrc/src/systems/userinput/bindings/xbox-controller-user";
printBindings("xboxControllerUserBindings", xboxControllerUserBindings);
//*/

/*/
const gearVRControllerUserBindings = generate3DOFTriggerBindings(paths.device.gearVRController);
printBindings("gearVRControllerUserBindings", gearVRControllerUserBindings);
//*/
