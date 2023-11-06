/** @jsx createElementEntity */

import { createElementEntity, renderAsEntity, Ref, createRef } from "../utils/jsx-entity";
import nametagSrc from "../assets/hud/nametag.9.png";
import { textureLoader } from "../utils/media-utils";
import { Button3D, BUTTON_TYPES } from "./button3D";
import { IconButton } from "./icon-button";

const panelTexture = textureLoader.load(nametagSrc);

export interface PanelParams {
  text: Array<string>;
  panelRef: Ref;
  micRef: Ref;
  nextRef?: Ref;
  prevRef?: Ref;
  snapRef?: Ref;
  maxSlideCount?: number;
  textRef?: Ref;
}

export function AgentPanel({ text, panelRef, nextRef, prevRef, micRef, snapRef, maxSlideCount }: PanelParams) {
  const buttonScale = [0.4, 0.4, 0.4];
  const buttonHeight = 0.2;
  let slidesArray = [];

  for (let i = 0; i < maxSlideCount!; i++) {
    slidesArray.push(
      <entity
        name={`slide ${i}`}
        panelIndex={{ index: i }}
        position={[0, 0, 0.01]}
        text={{
          value: "",
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
    <entity>
      <entity
        name="agentPanel"
        ref={panelRef}
        rotation={[0, 0, 0]}
        slice9={{ size: [0.6, 0.3], insets: [64, 66, 64, 66], texture: panelTexture }}
        position={[0, -0.35, 0.1]}
        scale={[1.0, 1.0, 1.0]}
      >
        {slidesArray}
      </entity>
      <Button3D
        ref={prevRef}
        scale={[buttonScale[0], buttonScale[1], buttonScale[2]]}
        type={BUTTON_TYPES.DEFAULT}
        position={[-0.3, 0, 0.03]}
        width={buttonHeight}
        height={buttonHeight}
        text={"<"}
      />

      <Button3D
        ref={nextRef}
        scale={[buttonScale[0], buttonScale[1], buttonScale[2]]}
        type={BUTTON_TYPES.DEFAULT}
        position={[0.3, 0, 0.03]}
        width={buttonHeight}
        height={buttonHeight}
        text={">"}
      />
      <IconButton
        ref={micRef}
        scale={[buttonScale[0], buttonScale[1], buttonScale[2]]}
        type={BUTTON_TYPES.MIC}
        position={[0.25, 0.15, 0]}
        width={buttonHeight}
        height={buttonHeight}
      />

      <IconButton
        ref={snapRef}
        scale={[buttonScale[0], buttonScale[1], buttonScale[2]]}
        type={BUTTON_TYPES.CAMERA}
        position={[-0.25, 0.15, 0]}
        width={buttonHeight}
        height={buttonHeight}
      />
    </entity>
  );
}

export function SimplePanel({
  text,
  panelRef,
  textRef,
  nextRef,
  prevRef,
  micRef,
  snapRef,
  maxSlideCount
}: PanelParams) {
  <entity>
    <entity
      name="agentPanel"
      ref={panelRef}
      rotation={[0, 0, 0]}
      slice9={{ size: [0.6, 0.3], insets: [64, 66, 64, 66], texture: panelTexture }}
      position={[0, -0.35, 0.1]}
      scale={[1.0, 1.0, 1.0]}
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
          fontSize: 0.05,
          maxWidth: 0.5
        }}
      />
    </entity>
  </entity>;
}
