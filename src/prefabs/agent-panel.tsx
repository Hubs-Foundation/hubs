/** @jsx createElementEntity */

import { createElementEntity, renderAsEntity, Ref, createRef, EntityDef } from "../utils/jsx-entity";
import nametagSrc from "../assets/hud/nametag.9.png";
import { textureLoader } from "../utils/media-utils";
import { TextButton3D, BUTTON_TYPES } from "./button3D";
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

export interface SimplePanelParams {
  panelRef: Ref;
  textRef: Ref;
  listenRef: Ref;
  navRef: Ref;
}

interface InteractivePanelParams {
  panelRef: Ref;
  textRef: Ref;
  dotsRef: Ref;
  clearRef: Ref;
  nextRef: Ref;
  prevRef: Ref;
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
      <TextButton3D
        ref={prevRef}
        scale={[buttonScale[0], buttonScale[1], buttonScale[2]]}
        type={BUTTON_TYPES.DEFAULT}
        position={[-0.3, 0, 0.03]}
        width={buttonHeight}
        height={buttonHeight}
        text={"<"}
      />

      <TextButton3D
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

export function SimplePanel({ panelRef, textRef, listenRef, navRef }: SimplePanelParams) {
  const buttonScale = [0.4, 0.4, 0.4];
  const buttonHeight = 0.2;
  return (
    <entity>
      <entity
        name="agentPanel"
        ref={panelRef}
        slice9={{ size: [0.8, 0.6], insets: [64, 66, 64, 66], texture: panelTexture }}
        position={[0, -0.3, 0.3]}
      >
        <entity
          name={`text`}
          position={[0, 0, 0.01]}
          ref={textRef}
          text={{
            value: "This is aaa test",
            color: "#000000",
            textAlign: "center",
            anchorX: "center",
            anchorY: "middle",
            fontSize: 0.05,
            maxWidth: 1
          }}
        />

        <TextButton3D
          ref={navRef}
          scale={[buttonScale[0], buttonScale[1], buttonScale[2]]}
          width={0.5}
          height={buttonHeight}
          type={BUTTON_TYPES.DEFAULT}
          text={"Clear"}
          visible={false}
        />
      </entity>

      <TextButton3D
        ref={listenRef}
        scale={[buttonScale[0], buttonScale[1], buttonScale[2]]}
        position={[0, -0.3, 0.3]}
        width={0.5}
        height={buttonHeight}
        type={BUTTON_TYPES.DEFAULT}
        text={"Ask"}
      />
    </entity>
  );
}

export function InteractivePanel({ panelRef, clearRef, dotsRef, nextRef, prevRef, textRef }: InteractivePanelParams) {
  const buttonScale = [0.4, 0.4, 0.4];
  const buttonHeight = 0.2;

  return (
    <entity>
      <entity
        name={`panel`}
        ref={panelRef}
        slice9={{ size: [0.8, 0.6], insets: [64, 66, 64, 66], texture: panelTexture }}
        position={[0, -0.3, 0.3]}
      >
        <TextButton3D
          name="clear"
          ref={clearRef}
          scale={[buttonScale[0], buttonScale[1], buttonScale[2]]}
          width={0.5}
          height={buttonHeight}
          type={BUTTON_TYPES.DEFAULT}
          text={"Reset"}
          visible={false}
        />

        <TextButton3D
          name="next"
          ref={nextRef}
          scale={[0.5, 0.5, 0.5]}
          position={[0.7, 0, 0]}
          width={0.2}
          height={0.2}
          type={BUTTON_TYPES.DEFAULT}
          text={">"}
        />
        <TextButton3D
          name="prev"
          ref={prevRef}
          scale={[0.5, 0.5, 0.5]}
          position={[-0.7, 0, 0]}
          width={0.2}
          height={0.2}
          type={BUTTON_TYPES.DEFAULT}
          text={"<"}
        />

        <entity
          name={`text`}
          position={[0, 0, 0.01]}
          ref={textRef}
          text={{
            value: "This is aaaaaaaa test",
            color: "#000000",
            textAlign: "center",
            anchorX: "center",
            anchorY: "middle",
            fontSize: 0.05,
            maxWidth: 1
          }}
        />
      </entity>

      <TextButton3D
        name="dots"
        ref={dotsRef}
        scale={[buttonScale[0], buttonScale[1], buttonScale[2]]}
        position={[0, -0.3, 0.3]}
        width={0.5}
        height={buttonHeight}
        type={BUTTON_TYPES.DEFAULT}
        text={"AAA"}
      />
    </entity>
  );
}
