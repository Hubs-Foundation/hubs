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
    .replace(/vive-var/, "keyboard")
    .replace(/pressed2/, "pressed")
    .replace(/joy y2/, "joy y")
    .replace(/_vec2/, "")
    .replace(/rising/, "pressed")
    .replace(/falling/, "released")
    .split("/")
    .slice(2);
  words[0] = capitalize(words[0]);
  return words.join(" ");
}

function prettyXform(xform) {
  return capitalize(fromCamelCase(xform.replace("falling", "released")));
}

function getSources(src) {
  if (src instanceof Array) {
    return src;
  } else {
    return Object.values(src);
  }
}

const excludeXforms = [
  "always",
  "any",
  "compose_vec2",
  "copy",
  "copyIfTrue",
  "max_vec2",
  "normalize_vec2",
  "rising",
  "risingWithFrameDelay",
  "scale",
  "touch_axis_scroll"
];

function getPaths(set, dest) {
  const paths = [];
  for (const binding of set) {
    if (!(binding.dest && binding.dest.value)) continue;
    if (!binding.src) continue;

    if (binding.dest.value === dest) {
      if (!excludeXforms.includes(binding.xform.name)) paths.push(prettyXform(binding.xform.name));
      for (const src of getSources(binding.src)) {
        const subPaths = getPaths(set, src);
        if (subPaths) paths.push(subPaths);
      }
    }
  }

  if (paths.length === 0) {
    return pretty(dest);
  }
  if (paths.length === 1 && typeof paths[0] === "string") {
    return paths[0];
  }
  return paths;
}

const exclude = [
  paths.actions.cameraDelta,
  paths.actions.cursor.right.stopDrawing,
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

function quoteLast(sentence) {
  const words = sentence.split(" ");
  if (words.length < 2) return words[0];
  return `${words[0]} "${words.slice(1).join(" ")}"`;
}

function formatSource(source, indent) {
  if (typeof source === "string") return indent + quoteLast(source);
  if (source.every(x => typeof x === "string")) return source.map(x => indent + "  " + quoteLast(x)).join("\n");
  return source.map(x => formatSource(x, indent + "  ")).join("\n") + "\n";
}

function formatSources(sources) {
  const indent = "      ";
  if (sources.length === 1 && typeof sources[0] === "string") {
    return indent + quoteLast(sources[0]);
  } else if (typeof sources === "string") {
    return indent + quoteLast(sources);
  } else {
    return sources.map(x => formatSource(x, indent)).join("\n");
  }
}

function flatten(arr) {
  if (arr.length === 1) {
    return flatten(arr[0]);
  }
  return arr;
}

function printSet(set) {
  for (const binding of set) {
    if (!(binding.dest && binding.dest.value)) continue;
    const dest = binding.dest.value;
    if (!dest.includes("/actions/") || exclude.includes(dest)) continue;
    if (!binding.src) continue;
    console.log(
      "\n    [" + pretty(binding.dest.value) + "]",
      "\n" +
        (excludeXforms.includes(binding.xform.name) ? "" : "      " + prettyXform(binding.xform.name) + "\n") +
        formatSources(flatten(getSources(binding.src).map(src => flatten(getPaths(set, src)))))
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

import { touchscreenUserBindings } from "../msrc/src/systems/userinput/bindings/touchscreen-user";
import { keyboardMouseUserBindings } from "../msrc/src/systems/userinput/bindings/keyboard-mouse-user";
import { oculusTouchUserBindings } from "../msrc/src/systems/userinput/bindings/oculus-touch-user";
import { viveUserBindings } from "../msrc/src/systems/userinput/bindings/vive-user";
import generate3DOFTriggerBindings from "../msrc/src/systems/userinput/bindings/oculus-go-user";
import { daydreamUserBindings } from "../msrc/src/systems/userinput/bindings/daydream-user";
import { xboxControllerUserBindings } from "../msrc/src/systems/userinput/bindings/xbox-controller-user";
const oculusGoUserBindings = generate3DOFTriggerBindings(paths.device.oculusgo);
const gearVRControllerUserBindings = generate3DOFTriggerBindings(paths.device.gearVRController);

[
  ["touchscreenUserBindings", touchscreenUserBindings],
  ["keyboardMouseUserBindings", keyboardMouseUserBindings],
  ["oculusTouchUserBindings", oculusTouchUserBindings],
  ["viveUserBindings", viveUserBindings],
  ["oculusGoUserBindings", oculusGoUserBindings],
  ["daydreamUserBindings", daydreamUserBindings],
  ["gearVRControllerUserBindings", gearVRControllerUserBindings],
  ["xboxControllerUserBindings", xboxControllerUserBindings]
].forEach(([name, bindings]) => printBindings(name, bindings));
