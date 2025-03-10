/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";

export function NetworkDebugPrefab() {
  return (
    <entity
      text={{
        value: "{}",
        color: "#FFFFFF",
        fontSize: 0.05,
        outlineColor: "#000000",
        outlineWidth: "5%",
        textAlign: "left",
        anchorX: "center",
        anchorY: "middle"
      }}
      networkDebug
    />
  );
}
