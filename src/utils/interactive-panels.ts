import { Object3D, Vector3 } from "three";
import { Text as TroikaText } from "troika-three-text";
import { Slice9 } from "../bit-components";
import { updateSlice9Geometry } from "../update-slice9-geometry";

export default UpdateTextPanel;

const PANEL_PADDING = 0.05;

function UpdateTextPanel(newNext: string, textObj: TroikaText, panelEid: number) {
  const formattedText = fortmatLines(newNext);
  textObj.addEventListener("synccomplete", () => {
    updateTextSize(textObj, panelEid);
  });
  textObj.text = formattedText;
}

function fortmatLines(newText: string): string {
  const lines = newText.split(/\s+/);
  const line_size = lines.length;
  const maxStep = 7;
  const step = line_size / 2 > maxStep ? maxStep : line_size > 3 ? Math.ceil(line_size / 2) : line_size;
  const formattedText = lines.map((word, index) => (index % step === step - 1 ? word + "\n" : word)).join(" ");
  return formattedText;
}

function updateTextSize(newTextObj: TroikaText, panelEid: number) {
  const rawSize = newTextObj.geometry.boundingBox?.getSize(new Vector3());
  const size = [rawSize!.x + PANEL_PADDING * 2, rawSize!.y + PANEL_PADDING * 2];
  Slice9.size[panelEid].set(size);
  updateSlice9Geometry(APP.world, panelEid);
}
