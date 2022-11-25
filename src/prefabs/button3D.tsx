/** @jsx createElementEntity */
import { createElementEntity, createRef } from "../utils/jsx-entity";
import { Layers } from "../camera-layers";
import buttonSrc from "../assets/hud/button.9.png";
import { textureLoader } from "../utils/media-utils";
import { Texture } from "three";
const buttonTexture = textureLoader.load(buttonSrc);

export enum BUTTON_TYPES {
  DEFAULT = 0,
  ACTION = 1
}

interface Button3DParams {
  text: string;
  width: number;
  height: number;
  texture: Texture;
  name?: string;
  type: BUTTON_TYPES.DEFAULT | BUTTON_TYPES.ACTION;
}

export function Button3D({ text, width, height, texture = buttonTexture, type, ...props }: Button3DParams) {
  const labelRef = createRef();
  return (
    <entity
      name={"Button"}
      slice9={{ size: [width, height], insets: [64, 66, 64, 66], texture }}
      cursorRaycastable
      remoteHoverTarget
      hoverButton={{ type }}
      textButton={{ labelRef }}
      singleActionButton
      layers={1 << Layers.CAMERA_LAYER_UI}
      {...props}
    >
      <entity
        ref={labelRef}
        layers={1 << Layers.CAMERA_LAYER_UI}
        text={{ value: text, color: "#000000", textAlign: "center", anchorX: "center", anchorY: "middle" }}
        position={[0, 0, 0.01]}
        name={props.name ? `${props.name} Label` : "Button Label"}
      />
    </entity>
  );
}
