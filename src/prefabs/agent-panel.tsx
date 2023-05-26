/** @jsx createElementEntity */

import { createElementEntity, renderAsEntity, Ref, createRef } from "../utils/jsx-entity";
import nametagSrc from "../assets/hud/nametag.9.png";
import { textureLoader } from "../utils/media-utils";
import { Button3D, BUTTON_TYPES } from "./button3D";

const panelTexture = textureLoader.load(nametagSrc);

export interface PanelParams {
  text: Array<string>;
  panelRef: Ref;
  textRef: Ref;
  nextRef: Ref;
  prevRef: Ref;
}

export function AgentPanel({ text, panelRef, textRef, nextRef, prevRef }: PanelParams) {
  const buttonScale = [0.4, 0.4, 0.4];
  const smallButtonScale = [0.2, 0.2, 0.2];
  const buttonHeight = 0.2;

  return (
    <entity
      name="agentPanel"
      ref={panelRef}
      slice9={{ size: [0.6, 0.3], insets: [64, 66, 64, 66], texture: panelTexture }}
      position={[0, 0.2, 0.1]}
      scale={[1.0, 1.0, 1.0]}
    >
      <entity
        name="text"
        panelIndex={{ index: 0 }}
        position={[0, 0, 0.01]}
        text={{
          value: text[0],
          color: "#000000",
          textAlign: "center",
          anchorX: "center",
          anchorY: "middle",
          fontSize: 0.05,
          maxWidth: 0.5
        }}
      />

      <entity
        name="text"
        panelIndex={{ index: 1 }}
        position={[0, 0, 0.01]}
        text={{
          value: text[1],
          color: "#000000",
          textAlign: "center",
          anchorX: "center",
          anchorY: "middle",
          fontSize: 0.05,
          maxWidth: 0.5
        }}
      />

      <entity
        name="text"
        panelIndex={{ index: 2 }}
        position={[0, 0, 0.01]}
        text={{
          value: text[2],
          color: "#000000",
          textAlign: "center",
          anchorX: "center",
          anchorY: "middle",
          fontSize: 0.05,
          maxWidth: 0.5
        }}
      />

      <entity
        name="text"
        panelIndex={{ index: 3 }}
        position={[0, 0, 0.01]}
        text={{
          value: text[3],
          color: "#000000",
          textAlign: "center",
          anchorX: "center",
          anchorY: "middle",
          fontSize: 0.05,
          maxWidth: 0.5
        }}
      />

      <entity
        name="text"
        panelIndex={{ index: 4 }}
        position={[0, 0, 0.01]}
        text={{
          value: text[4],
          color: "#000000",
          textAlign: "center",
          anchorX: "center",
          anchorY: "middle",
          fontSize: 0.05,
          maxWidth: 0.5
        }}
      />

      <Button3D
        ref={prevRef}
        scale={[buttonScale[0], buttonScale[1], buttonScale[2]]}
        type={BUTTON_TYPES.DEFAULT}
        position={[-0.4, 0, 0.03]}
        width={buttonHeight}
        height={buttonHeight}
        text={"<"}
      />

      <Button3D
        ref={nextRef}
        scale={[buttonScale[0], buttonScale[1], buttonScale[2]]}
        type={BUTTON_TYPES.DEFAULT}
        position={[0.4, 0, 0.03]}
        width={buttonHeight}
        height={buttonHeight}
        text={">"}
      />

      <Button3D
        ref={textRef}
        scale={[buttonScale[0], buttonScale[1], buttonScale[2]]}
        type={BUTTON_TYPES.ACTION}
        position={[0, -0.2, 0.03]}
        width={0.6}
        height={buttonHeight}
        text={"Change Text"}
      />
    </entity>
  );
}
