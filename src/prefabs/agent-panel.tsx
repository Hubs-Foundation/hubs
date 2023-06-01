/** @jsx createElementEntity */

import { createElementEntity, renderAsEntity, Ref, createRef } from "../utils/jsx-entity";
import nametagSrc from "../assets/hud/nametag.9.png";
import { textureLoader } from "../utils/media-utils";
import { Button3D, BUTTON_TYPES } from "./button3D";
import { Mic3D } from "./Mic3D";

const panelTexture = textureLoader.load(nametagSrc);

export interface PanelParams {
  text: Array<string>;
  panelRef: Ref;
  micRef: Ref;
  nextRef: Ref;
  prevRef: Ref;
  maxSlideCount: number;
}

export function AgentPanel({ text, panelRef, nextRef, prevRef, micRef, maxSlideCount }: PanelParams) {
  const buttonScale = [0.4, 0.4, 0.4];
  const buttonHeight = 0.2;
  let slidesArray = [];

  for (let i = 0; i < maxSlideCount; i++) {
    slidesArray.push(
      <entity
        name={`slide ${i}`}
        panelIndex={{ index: i }}
        position={[0, 0, 0.01]}
        text={{
          value: text[i],
          color: "#000000",
          textAlign: "center",
          anchorX: "center",
          anchorY: "middle",
          fontSize: 0.05,
          maxWidth: 0.5
        }}
      />
    );
  }

  return (
    <entity
      name="agentPanel"
      ref={panelRef}
      slice9={{ size: [0.6, 0.3], insets: [64, 66, 64, 66], texture: panelTexture }}
      position={[0, 0.2, 0.1]}
      scale={[1.0, 1.0, 1.0]}
    >
      {slidesArray}

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

      <Mic3D
        ref={micRef}
        scale={[buttonScale[0], buttonScale[1], buttonScale[2]]}
        type={BUTTON_TYPES.DEFAULT}
        position={[0.18, -0.25, 0.03]}
        width={buttonHeight}
        height={buttonHeight}
      />
    </entity>
  );
}
