import { Object3D } from "three";

export default UpdateTextPanel;

function UpdateTextPanel(newNext: string, panelObj: Object3D) {
  const formattedText = fortmatLines(newNext);
}

function fortmatLines(newText: string): string {
  const lines = newText.split(/\s+/);
  const line_size = lines.length;
  const maxStep = 7;
  const step = line_size / 2 > maxStep ? maxStep : line_size > 3 ? Math.ceil(line_size / 2) : line_size;
  const formattedText = lines.map((word, index) => (index % step === step - 1 ? word + "\n" : word)).join(" ");
  return formattedText;
}
