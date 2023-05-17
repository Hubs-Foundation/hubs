/** @jsx createElementEntity */
import { Texture } from "three";
import { ArrayVec3, Attrs, Ref, createElementEntity, createRef } from "../utils/jsx-entity";
import { Button3D, BUTTON_TYPES } from "./button3D";
import { textureLoader } from "../utils/media-utils";
import textBgSrc from "../assets/hud/tooltip.9.png";
import nameBgSrc from "../assets/hud/nametag.9.png";
import { Layers } from "../camera-layers";

const textBgTexture = textureLoader.load(textBgSrc);
const nameBgTexture = textureLoader.load(nameBgSrc);

const buttonHeight = 0.2;
const buttonScale: ArrayVec3 = [0.75, 0.75, 0.75];

const position = {
  end: [0.8, 1.1, 0] as ArrayVec3,
  turn: [-0.8, 1.1, 0] as ArrayVec3,
  text: [0, 0.6, -0.05] as ArrayVec3,
  A: [0, 0.1, 0] as ArrayVec3,
  B: [0, -0.1, 0] as ArrayVec3,
  C: [0, -0.3, 0] as ArrayVec3,
  D: [0, -0.5, 0] as ArrayVec3,
  start: [0, 0.1, 0] as ArrayVec3
};

interface GameButtonParams extends Attrs {
  text: string;
  texture?: Texture;
  disableButton?: boolean;
}

interface Text3DParams extends Attrs {
  text: string;
  width: number;
  height: number;
  texture?: Texture;
  name?: string;
  labelRef?: Ref;
  color?: string;
}

export function Text3D({
  text,
  width,
  height,
  name = "Text",
  texture = textBgTexture,
  color = "#ffffff",
  ...props
}: Text3DParams) {
  const labelRef = createRef();
  return (
    <entity
      name={name}
      slice9={{ size: [width, height], insets: [64, 66, 64, 66], texture }}
      layers={1 << Layers.CAMERA_LAYER_UI}
      {...props}
    >
      <entity
        ref={labelRef}
        layers={1 << Layers.CAMERA_LAYER_UI}
        text={{ value: text, color, textAlign: "center", anchorX: "center", anchorY: "middle" }}
        position={[0, 0, 0.01]}
        name={`${name} Label`}
      />
    </entity>
  );
}

function GameButton(props: GameButtonParams) {
  return (
    <Button3D
      name="Button"
      scale={buttonScale}
      width={0.4}
      height={buttonHeight}
      type={BUTTON_TYPES.ACTION}
      {...props}
    />
  );
}

export function GameMenuPrefab() {
  const refs = {
    text: createRef(),
    turn: createRef(),
    A: createRef(),
    B: createRef(),
    C: createRef(),
    D: createRef(),
    start: createRef(),
    end: createRef()
  };

  return (
    <entity
      name="Game Menu"
      gameMenu={{
        TextRef: refs.text,
        AButtonRef: refs.A,
        BButtonRef: refs.B,
        CButtonRef: refs.C,
        DButtonRef: refs.D,
        StartButtonRef: refs.start,
        EndButtonRef: refs.end,
        TurnRef: refs.turn
      }}
      billboard={{ onlyY: true }}
    >
      <Text3D ref={refs.text} position={position.text} text={""} width={2} height={0.75} />
      <GameButton ref={refs.turn} position={position.turn} text={"Your Turn"} texture={nameBgTexture} disableButton />
      <GameButton ref={refs.A} position={position.A} text={"A"} />
      <GameButton ref={refs.B} position={position.B} text={"B"} />
      <GameButton ref={refs.C} position={position.C} text={"C"} />
      <GameButton ref={refs.D} position={position.D} text={"D"} />
      <GameButton ref={refs.start} position={position.start} text={"Start"} />
      <GameButton ref={refs.end} position={position.end} text={"End"} />
    </entity>
  );
}
