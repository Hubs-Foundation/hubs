/** @jsx createElementEntity */
import { Attrs, createElementEntity, createRef, Ref } from "../utils/jsx-entity";
import { Layers } from "../camera-layers";
import micSrc from "../assets/images/mic_level@2x.png";
import backgroundSrc from "../assets/hud/button.9.png";
import { textureLoader } from "../utils/media-utils";
import { Texture } from "three";
import { BUTTON_TYPES } from "./button3D";
const backTexture = textureLoader.load(backgroundSrc);
const micTexture = textureLoader.load(micSrc);

type ButtonType = BUTTON_TYPES.DEFAULT | BUTTON_TYPES.ACTION | BUTTON_TYPES.MIC;

export interface Refable {
  ref?: Ref;
}

export interface Mic3DParams extends Attrs {
  width: number;
  height: number;
  texture?: Texture;
  name?: string;
  type: ButtonType;
  labelRef?: Ref;
  holdable?: true;
  holdableButton?: true;
}

export function Mic3D({ width, height, name = "Button", type, ...props }: Mic3DParams) {
  const labelRef = createRef();
  return (
    <entity
      name={name}
      slice9={{ size: [width, height], insets: [64, 66, 64, 66], texture: backTexture }}
      cursorRaycastable
      remoteHoverTarget
      hoverButton={{ type }}
      imageButton={{ labelRef }}
      singleActionButton
      micButtonTag
      layers={1 << Layers.CAMERA_LAYER_UI}
      {...props}
    >
      <entity
        ref={labelRef}
        layers={1 << Layers.CAMERA_LAYER_UI}
        slice9={{ size: [width, height], insets: [64, 66, 64, 66], texture: micTexture }}
        position={[0, 0, 0.01]}
        name={`${name} Label`}
      />
    </entity>
  );
}
