import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent } from "bitecs";
import { PanelIndex } from "../bit-components";
import { HubsWorld } from "../app";
import { greetingPhrases, paradigms } from "./text-paradigms";
import { Text } from "troika-three-text";
import { getRandomInt, virtualAgent } from "./agent-system";

let activeIndex = 0;
let updated = false;
let maxValue = 4;
const minValue = 0;
const SlideQuery = defineQuery([PanelIndex]);
const slideEnterQuery = enterQuery(SlideQuery);
const slideExitQuery = exitQuery(SlideQuery);

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

export function UpdateTextSystem(world: HubsWorld, newText: string) {
  const newFormatedText = FromatNewText(newText);
  const textCount = newFormatedText.length;

  SlideQuery(world).forEach(eid => {
    const panelObj = world.eid2obj.get(eid) as Text;

    if (PanelIndex.index[eid] >= textCount) {
      panelObj.visible = false;
    } else {
      panelObj.text = newFormatedText[PanelIndex.index[eid]];
      panelObj.visible = true;
    }
    maxValue = newFormatedText.length - 1;
    resetIndex();
    virtualAgent.HandleArrows(textCount !== 1);

    return textCount === 1;
  });
}

export function PanelIndexSystem(world: HubsWorld) {
  if (slideEnterQuery(world).length || slideExitQuery(world).length) {
    UpdateTextSystem(world, greetingPhrases[getRandomInt(greetingPhrases.length)]);
  }

  SlideQuery(world).forEach(eid => {
    const panelObj = world.eid2obj.get(eid);
    panelObj!.visible = PanelIndex.index[eid] === activeIndex;
  });

  if (updated) {
    updated = false;
  }
}
