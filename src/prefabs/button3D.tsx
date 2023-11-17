/** @jsx createElementEntity */
import { Attrs, createElementEntity, createRef, Ref } from "../utils/jsx-entity";
import { Layers } from "../camera-layers";
import buttonSrc from "../assets/hud/button.9.png";
import { textureLoader } from "../utils/media-utils";
import { ProjectionMode } from "../utils/projection-mode";
import { AlphaMode } from "../utils/create-image-mesh";
import { Texture } from "three";
const buttonTexture = textureLoader.load(buttonSrc);

export enum BUTTON_TYPES {
  DEFAULT = 0,
  ACTION = 1
}

type ButtonType = BUTTON_TYPES.DEFAULT | BUTTON_TYPES.ACTION;

export interface Refable {
  ref?: Ref;
}

export interface Button3DParams extends Attrs {
  text?: string;
  width: number;
  height: number;
  texture?: Texture;
  icon?: { texture: Texture; cacheKey: string; scale: [number, number, number] };
  name?: string;
  type: ButtonType;
  labelRef?: Ref;
  holdable?: true;
  holdableButton?: true;
}

export function Button3D({
  text,
  width,
  height,
  icon,
  texture = buttonTexture,
  name = "Button",
  type,
  ...props
}: Button3DParams) {
  const labelRef = createRef();

  // TODO: Can here be rewritten more elegantly?
  // TODO: Avoid any
  const iconOrText: Record<string, any> = {};
  if (icon !== undefined) {
    iconOrText.image = {
      texture: icon.texture,
      ratio: 1,
      projection: ProjectionMode.FLAT,
      alphaMode: AlphaMode.BLEND,
      cacheKey: icon.cacheKey,
      renderOrder: APP.RENDER_ORDER.HUD_ICONS
    };
    iconOrText.scale = icon.scale;
  } else {
    iconOrText.text = {
      value: text || "",
      color: "#000000",
      textAlign: "center",
      anchorX: "center",
      anchorY: "middle"
    };
  }

  return (
    <entity
      name={name}
      slice9={{ size: [width, height], insets: [64, 66, 64, 66], texture, transparent: false, alphaTest: 0.1 }}
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
        position={[0, 0, 0.01]}
        name={`${name} Label`}
        {...iconOrText}
      />
    </entity>
  );
}
