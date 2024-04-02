import { Mesh, Object3D, Vector3 } from "three";
import { Text as TroikaText } from "troika-three-text";
import { Slice9 } from "../bit-components";
import { updateSlice9Geometry } from "../update-slice9-geometry";

const PANEL_PADDING = 0.05;

export function UpdatePanelSize(panelEid: number, size: number[] | Float32Array) {
  Slice9.size[panelEid].set(size);
  updateSlice9Geometry(APP.world, panelEid);
  const panelObj = APP.world.eid2obj.get(panelEid);
  panelObj?.updateMatrix();
}

function GetObjSize(obj: Object3D) {
  const boundingBox = new THREE.Box3();
  boundingBox.setFromObject(obj);
  const rawSize = boundingBox.getSize(new THREE.Vector3());
  return [rawSize.x, rawSize.y];
}

export function GetTextSize(textObj: TroikaText): Float32Array {
  const rawSize = textObj.geometry.boundingBox?.getSize(new Vector3());

  const finalSize = new Float32Array([rawSize!.x, rawSize!.y]);
  return finalSize;
}

function fortmatLines(newText: string): string {
  const lines = newText.split(/\s+/);
  const line_size = lines.length;
  const maxStep = 7;
  const step = line_size / 2 > maxStep ? maxStep : line_size > 3 ? Math.ceil(line_size / 2) : line_size;
  const formattedText = lines.map((word, index) => (index % step === step - 1 ? word + "\n" : word)).join(" ");
  return formattedText;
}
