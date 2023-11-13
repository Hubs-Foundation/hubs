/** @jsx createElementEntity */
import { ArrayVec3, Attrs, createElementEntity, createRef, Ref } from "../utils/jsx-entity";
import { Layers } from "../camera-layers";
// import backgroundSrc from "../assets/hud/button.9.png";
import selectedSrc from "../assets/images/flags/flag_background-selected.png";
import backgroundSrc from "../assets/images/flags/flag_background.png";
import flagEsSrc from "../assets/images/flags/es_flag.png";
import flagItSrc from "../assets/images/flags/it_flag.png";
import flagDeSrc from "../assets/images/flags/de_flag.png";
import flagDuSrc from "../assets/images/flags/du_flag.png";
import flagElSrc from "../assets/images/flags/el_flag.png";
import { textureLoader } from "../utils/media-utils";
import { Texture } from "three";
import { BUTTON_TYPES } from "./button3D";
import { ProjectionMode } from "../utils/projection-mode";
import { AlphaMode } from "../utils/create-image-mesh";

export const backTexture = textureLoader.load(backgroundSrc);
export const esFlagTexture = textureLoader.load(flagEsSrc);
export const itFlagTexture = textureLoader.load(flagItSrc);
export const deFlagTexture = textureLoader.load(flagDeSrc);
export const duFlagTexture = textureLoader.load(flagDuSrc);
export const elFlagTexture = textureLoader.load(flagElSrc);

export enum FLAGS {
  EL,
  DU,
  DE,
  ES,
  IT
}

type FlagType = FLAGS.DE | FLAGS.DU | FLAGS.IT | FLAGS.ES | FLAGS.EL;

type ButtonType =
  | BUTTON_TYPES.DEFAULT
  | BUTTON_TYPES.ACTION
  | BUTTON_TYPES.MIC
  | BUTTON_TYPES.CAMERA
  | BUTTON_TYPES.FLAG;

const flags = {
  [FLAGS.DE]: deFlagTexture,
  [FLAGS.ES]: esFlagTexture,
  [FLAGS.IT]: itFlagTexture,
  [FLAGS.DU]: duFlagTexture,
  [FLAGS.EL]: elFlagTexture
};

export interface Refable {
  ref?: Ref;
}

export interface FlagButtonParams extends Attrs {
  width: number;
  texture?: Texture;
  name?: string;
  type: ButtonType;
  flag: FlagType;
  labelRef?: Ref;
  holdable?: true;
  holdableButton?: true;
}

export function FlagButton({ width, name = "FlagButton", type, flag, ...props }: FlagButtonParams) {
  const labelRef = createRef();

  return (
    <entity
      name={name}
      image={{
        texture: backTexture,
        ratio: 1,
        projection: ProjectionMode.FLAT,
        alphaMode: AlphaMode.Mask,
        cacheKey: ""
      }}
      scale={[width, width, width]}
      cursorRaycastable
      remoteHoverTarget
      hoverButton={{ type }}
      singleActionButton
      layers={1 << Layers.CAMERA_LAYER_UI}
      {...props}
    >
      <entity
        image={{
          texture: flags[flag],
          ratio: 0.74,
          projection: ProjectionMode.FLAT,
          alphaMode: AlphaMode.Mask,
          cacheKey: ""
        }}
        scale={[0.6, 0.6, 0.6]}
        ref={labelRef}
        layers={1 << Layers.CAMERA_LAYER_UI}
        position={[0, 0, 0.01]}
        name={`${name} Label`}
      />
    </entity>
  );
}
