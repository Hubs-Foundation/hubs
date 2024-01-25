/** @jsx createElementEntity */
import { Color } from "three";
import { ArrayVec3, Attrs, createElementEntity, createRef } from "../utils/jsx-entity";
import { Button3D, BUTTON_TYPES } from "./button3D";
import { Label } from "./camera-tool";
import { loadTexture, loadTextureFromCache } from "../utils/load-texture";
import snapIconSrc from "../assets/spawn_message.png";

const BUTTON_HEIGHT = 0.2;
const BUTTON_SCALE: ArrayVec3 = [0.6, 0.6, 0.6];
const BIG_BUTTON_SCALE: ArrayVec3 = [0.8, 0.8, 0.8];
const BUTTON_WIDTH = 0.2;

export async function loadPDFMenuButtonIcons() {
  return Promise.all([loadTexture(snapIconSrc, 1, "image/png")]);
}

interface PDFPageButtonProps extends Attrs {
  text: string;
}

function PDFPageButton(props: PDFPageButtonProps) {
  return (
    <Button3D
      name={props.name}
      scale={BIG_BUTTON_SCALE}
      width={BUTTON_WIDTH}
      height={BUTTON_HEIGHT}
      type={BUTTON_TYPES.ACTION}
      {...props}
    />
  );
}

function SnapButton(props: Attrs) {
  const { texture, cacheKey } = loadTextureFromCache(snapIconSrc, 1);
  return (
    <Button3D
      name="Remove Button"
      scale={BUTTON_SCALE}
      width={BUTTON_HEIGHT}
      height={BUTTON_WIDTH}
      type={BUTTON_TYPES.ACTION}
      icon={{ texture, cacheKey, scale: [0.165, 0.165, 0.165] }}
      {...props}
    />
  );
}

const UI_Z = 0.001;
const POSITION_PREV: ArrayVec3 = [-0.35, 0.0, UI_Z];
const POSITION_NEXT: ArrayVec3 = [0.35, 0.0, UI_Z];
const POSITION_LABEL: ArrayVec3 = [0.0, -0.45, UI_Z];
const POSITION_SNAP: ArrayVec3 = [0.0, 0.45, UI_Z];
const PAGE_LABEL_COLOR = new Color(0.1, 0.1, 0.1);
export function PDFMenuPrefab() {
  const refPrev = createRef();
  const refNext = createRef();
  const refLabel = createRef();
  const refSnap = createRef();
  return (
    <entity
      name="PDF Menu"
      objectMenuTransform={{ scale: true }}
      pdfMenu={{
        prevButtonRef: refPrev,
        nextButtonRef: refNext,
        pageLabelRef: refLabel,
        snapRef: refSnap
      }}
    >
      <SnapButton name="Snap Button" ref={refSnap} position={POSITION_SNAP} />
      <PDFPageButton name="Previous Page Button" text="<" ref={refPrev} position={POSITION_PREV} />
      <PDFPageButton name="Next Page Button" text=">" ref={refNext} position={POSITION_NEXT} />
      <Label ref={refLabel} position={POSITION_LABEL} text={{ color: PAGE_LABEL_COLOR }} />
    </entity>
  );
}
