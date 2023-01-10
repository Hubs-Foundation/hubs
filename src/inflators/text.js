import { addComponent } from "bitecs";
import { Text as TroikaText } from "troika-three-text";
import { Text } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";

const THREE_SIDES = {
  front: THREE.FrontSide,
  back: THREE.BackSide,
  double: THREE.DoubleSide
};

const DEFAULTS = {
  textAlign: "center",
  anchorX: "center",
  anchorY: "middle"
};

export function inflateText(world, eid, componentProps) {
  componentProps = Object.assign({}, DEFAULTS, componentProps);
  addComponent(world, Text, eid);
  const text = new TroikaText();
  Object.entries(componentProps).forEach(([name, value]) => {
    switch (name) {
      case "value":
        text.text = value;
        break;
      case "side":
        text.material.side = THREE_SIDES[value];
        break;
      case "opacity":
        text.material.side = value;
        break;
      case "fontUrl":
        text.font = value;
        break;
      default:
        text[name] = value;
    }
  });
  text.sync();
  addObject3DComponent(world, eid, text);
}
