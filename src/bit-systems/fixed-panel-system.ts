import { defineQuery, enterQuery, exitQuery, removeComponent } from "bitecs";
import { Object3D, Quaternion, Vector3 } from "three";
import { Object3DTag, FixedTextPanel, Slice9 } from "../bit-components";
import { HubsWorld } from "../app";
import { Text } from "troika-three-text";
import { GreetingPhrases } from "../components/translate-panel";
import { translationSystem } from "./translation-system";
import { GetTextSize } from "../utils/interactive-panels";
import { updateSlice9Geometry } from "../update-slice9-geometry";

interface TranslateEventParams {
  id: string;
  text: string;
}

const PANEL_PADDING = 0.05;
const PANEL_WIDTH = 6.9;
const MIN_PANEL_HEIGHT = 1.5;

const fixedPanelQuery = defineQuery([FixedTextPanel]);
const panelEnterQuery = enterQuery(fixedPanelQuery);
const panelExitQuery = exitQuery(fixedPanelQuery);

let fixedPanelObj: Object3D | null;
let fixedPanelRef: number | null;
let textObj: Text | null;
let textRef: number | null;

let myLanguage: "spanish" | "italian" | "greek" | "dutch" | "german" | "english";

export function FixedPanelSystem(world: HubsWorld) {
  panelEnterQuery(world).forEach(fixedPanelEid => {
    if (fixedPanelRef !== fixedPanelEid) {
      APP.scene!.addEventListener("translation_available", onTranslationAvailable);
      fixedPanelRef = fixedPanelEid;
      fixedPanelObj = world.eid2obj.get(fixedPanelEid)!;
      textRef = FixedTextPanel.textRef[fixedPanelEid];
      textObj = world.eid2obj.get(textRef)! as Text;
      textObj.addEventListener("synccomplete", updateTextSize);

      myLanguage = translationSystem.mylanguage;
      textObj.text = GreetingPhrases[myLanguage];
    }
  });
  panelExitQuery(world).forEach(() => {
    APP.scene!.removeEventListener("translation_available", onTranslationAvailable);
    textObj!.removeEventListener("synccomplete", updateTextSize);
    fixedPanelRef = null;
    fixedPanelObj = null;
    textRef = null;
    textObj = null;
  });
}

function onTranslationAvailable(event: any) {
  const details = event.detail as TranslateEventParams;
  if (!details.text) return;
  UpdateText(details.text);
}

function UpdateText(text: string) {
  if (!text) return;
  textObj!.text = text;
}

function updateTextSize() {
  const size = GetTextSize(textObj!);
  size[0] = PANEL_WIDTH;

  size[1] = size[1] + 2 * PANEL_PADDING < MIN_PANEL_HEIGHT ? MIN_PANEL_HEIGHT : size[1] + 2 * PANEL_PADDING;
  Slice9.size[fixedPanelRef!].set(size);
  updateSlice9Geometry(APP.world, fixedPanelRef);
  fixedPanelObj!.updateMatrix();
}
