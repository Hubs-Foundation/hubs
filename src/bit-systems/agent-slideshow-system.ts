import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent } from "bitecs";
import { PanelIndex } from "../bit-components";
import { HubsWorld } from "../app";
import { paradigms } from "./text-paradigms";
import { Text } from "troika-three-text";

let activeIndex = 0;
let updated = false;
let maxValue = 4;
const minValue = 0;
const agentSlideQuery = defineQuery([PanelIndex]);
const agentEnterQuery = enterQuery(agentSlideQuery);
const agentExitQuery = exitQuery(agentSlideQuery);

export function raiseIndex() {
  activeIndex++;
  if (activeIndex > maxValue) activeIndex = minValue;
  updated = true;
}

export function lowerIndex() {
  activeIndex--;
  if (activeIndex < minValue) activeIndex = maxValue;
  updated = true;
}

export function resetIndex() {
  activeIndex = minValue;
  updated = true;
}

export function FromatNewText(newText: string) {
  const words = newText.trim().split(" ");
  const segments = [];

  for (let i = 0; i < words.length; i += 10) {
    const segment = words.slice(i, i + 10).join(" ");
    segments.push(segment);
  }

  return segments;
}

export function UpdateTextSystem(world: HubsWorld, newFormatedText: Array<string>) {
  const textCount = newFormatedText.length;

  agentSlideQuery(world).forEach(eid => {
    const panelObj = world.eid2obj.get(eid) as Text;

    if (PanelIndex.index[eid] >= textCount) {
      panelObj.visible = false;
    } else {
      panelObj.text = newFormatedText[PanelIndex.index[eid]];
      panelObj.visible = true;
    }
    maxValue = newFormatedText.length - 1;
  });

  resetIndex();

  return textCount === 1;
}

export function setMicStatus() {}

export function PanelIndexSystem(world: HubsWorld) {
  if (agentEnterQuery(world).length || agentExitQuery(world).length) {
    resetIndex();
  }

  agentSlideQuery(world).forEach(eid => {
    const panelObj = world.eid2obj.get(eid);
    panelObj!.visible = PanelIndex.index[eid] === activeIndex;
  });

  if (updated) {
    console.log("New index:", activeIndex);
    updated = false;
  }
}
