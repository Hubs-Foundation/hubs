/** @jsx createElementEntity */
import { ArrayVec3, Attrs, createElementEntity, createRef, Ref } from "../utils/jsx-entity";
import { Layers } from "../camera-layers";
import backgroundSrc from "../assets/hud/button.9.png";
import recIconSrc from "../assets/hud/button.9.png";
import stopIconSrc from "../assets/hud/nametag.9.png";
import cameraIconSrc from "../assets/images/location.png";
import { textureLoader } from "../utils/media-utils";
import { Texture } from "three";
import { BUTTON_TYPES } from "./button3D";

export const backTexture = textureLoader.load(backgroundSrc);
export const startRecButtonTexture = textureLoader.load(recIconSrc);
export const stopRecButtonTexture = textureLoader.load(stopIconSrc);
export const snapButtonTexture = textureLoader.load(cameraIconSrc);

type ButtonType = BUTTON_TYPES.DEFAULT | BUTTON_TYPES.ACTION | BUTTON_TYPES.MIC | BUTTON_TYPES.CAMERA;

export interface Refable {
  ref?: Ref;
}

export interface IconButtonParams extends Attrs {
  width: number;
  height: number;
  texture?: Texture;
  name?: string;
  type: ButtonType;
  labelRef?: Ref;
  holdable?: true;
  holdableButton?: true;
}

export function IconButton({ width, height, name = "Button", type, ...props }: IconButtonParams) {
  const labelRef = createRef();
  var iconTexture;
  var iconSize: ArrayVec3;
  if (type === BUTTON_TYPES.MIC) {
    iconTexture = startRecButtonTexture;
    iconSize = [0.4, 0.4, 0.4];
  } else {
    iconTexture = snapButtonTexture;
    iconSize = [1, 1, 1];
  }
  return (
    <entity
      name={name}
      slice9={{ size: [width, height], insets: [64, 66, 64, 66], texture: backTexture }}
      cursorRaycastable
      remoteHoverTarget
      hoverButton={{ type }}
      iconButton={{ labelRef }}
      singleActionButton
      layers={1 << Layers.CAMERA_LAYER_UI}
      {...props}
    >
      <entity
        ref={labelRef}
        layers={1 << Layers.CAMERA_LAYER_UI}
        slice9={{ size: [width, height], insets: [64, 66, 64, 66], texture: iconTexture }}
        scale={iconSize}
        position={[0, 0, 0.01]}
        rotation={[0, 0, 3.1415926536]}
        name={`${name} Label`}
      />
    </entity>
  );
}
