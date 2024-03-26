/** @jsx createElementEntity */

import { createElementEntity, createRef, Ref, renderAsEntity } from "../utils/jsx-entity";
import nametagSrc from "../assets/hud/nametag.9.png";
import { textureLoader } from "../utils/media-utils";
import { HubsWorld } from "../app";

const panelTexture = textureLoader.load(nametagSrc);

export interface FixedPanelParams {
  pos: [number, number, number];
}

export function FixedPanel({ pos }: FixedPanelParams) {
  const panelRef = createRef();
  const textRef = createRef();
  return (
    <entity
      name="fixedPanel"
      ref={panelRef}
      fixedPanel={{ textRef: textRef }}
      slice9={{ size: [6.9, 2.1], insets: [60, 60, 60, 60], texture: panelTexture }}
      position={pos}
    >
      <entity
        name={`text`}
        position={[0, 0, 0.01]}
        ref={textRef}
        text={{
          value: "This is a test",
          color: "#000000",
          textAlign: "center",
          anchorX: "center",
          anchorY: "middle",
          fontSize: 0.35,
          maxWidth: 6.5
        }}
      />
    </entity>
  );
}

export function RenderFixedPanel(world: HubsWorld, pos: [number, number, number]) {
  const eid = renderAsEntity(world, FixedPanel({ pos }));
  const obj = world.eid2obj.get(eid)!;
  world.scene.add(obj);
  return eid;
}
