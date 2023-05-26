import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent } from "bitecs";
import { PanelIndex } from "../bit-components";
import { HubsWorld } from "../app";

let activeIndex = 0;
let updated = false;
const maxValue = 4;
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
