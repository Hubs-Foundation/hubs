function findFinalDest(set, src, depth = 0) {
  if (!src) return [];
  for (const binding of set) {
    if (!binding.src) continue;
    for (const srcVal of Object.values(binding.src)) {
      if (srcVal === src) {
        const dest = Object.values(binding.dest)[0];
        return findFinalDest(set, dest, depth + 1) || [dest, depth];
      }
    }
  }
  return [src, depth];
}

function findPath(set, binding) {
  if (!binding || !binding.dest || !binding.src) return;
  const keys = Object.keys(binding.src);
  const src = keys.includes("value") ? binding.src.value : Object.values(binding.src);
  const [dest, depth] = findFinalDest(set, Object.values(binding.dest)[0]);
  return { src, dest, depth };
}

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

function printSet(set) {
  const pathsByDest = new Map();
  for (const binding of set) {
    const path = findPath(set, binding);
    if (!path) continue;
    const paths = pathsByDest.get(path.dest) || [];
    paths.push(path);
    pathsByDest.set(path.dest, paths);
  }

  for (const [, paths] of pathsByDest.entries()) {
    paths.sort((a, b) => a.depth < b.depth);
    const maxDepth = paths[0].depth;
    for (const path of paths) {
      if (path.depth < maxDepth) break;
      const src = path.src;
      const prettySrc =
        typeof src === "string"
          ? quoteLast(pretty(src))
          : src
              .map(pretty)
              .map(quoteLast)
              .join(", ");
      if (!path.dest) continue;
      const prettyDest = pretty(path.dest);
      // /noop
      if (!prettyDest) continue;
      console.log("   ", rightPad(prettyDest, 50), "<-", prettySrc);
    }
  }
}

function printBindings(bindingsName, bindings) {
  console.log("\n" + fromCamelCase(bindingsName));
  for (const setName in bindings) {
    console.log("\n  " + fromCamelCase(setName));
    printSet(bindings[setName]);
  }
}

import { xboxControllerUserBindings } from "../msrc/src/systems/userinput/bindings/xbox-controller-user";
printBindings("xboxControllerUserBindings", xboxControllerUserBindings);

import { viveUserBindings } from "../msrc/src/systems/userinput/bindings/vive-user";
printBindings("viveUserBindings", viveUserBindings);

import { touchscreenUserBindings } from "../msrc/src/systems/userinput/bindings/touchscreen-user";
printBindings("touchscreenUserBindings", touchscreenUserBindings);

import { oculusTouchUserBindings } from "../msrc/src/systems/userinput/bindings/oculus-touch-user";
printBindings("oculusTouchUserBindings", oculusTouchUserBindings);

import { paths } from "../msrc/src/systems/userinput/paths";

import generate3DOFTriggerBindings from "../msrc/src/systems/userinput/bindings/oculus-go-user";
const gearVRControllerUserBindings = generate3DOFTriggerBindings(paths.device.gearVRController);
printBindings("gearVRControllerUserBindings", gearVRControllerUserBindings);

const oculusGoUserBindings = generate3DOFTriggerBindings(paths.device.oculusgo);
printBindings("oculusGoUserBindings", oculusGoUserBindings);

import { daydreamUserBindings } from "../msrc/src/systems/userinput/bindings/daydream-user";
printBindings("daydreamUserBindings", daydreamUserBindings);

import { keyboardMouseUserBindings } from "../msrc/src/systems/userinput/bindings/keyboard-mouse-user";
printBindings("keyboardMouseUserBindings", keyboardMouseUserBindings);
