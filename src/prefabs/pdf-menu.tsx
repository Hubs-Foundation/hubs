/** @jsx createElementEntity */
import { Color } from "three";
import { ArrayVec3, Attrs, createElementEntity, createRef } from "../utils/jsx-entity";
import { Button3D, BUTTON_TYPES } from "./button3D";
import { Label } from "./camera-tool";

const BUTTON_HEIGHT = 0.2;
const BUTTON_SCALE: ArrayVec3 = [0.4, 0.4, 0.4];
const BUTTON_WIDTH = 0.3;

interface PDFPageButtonProps extends Attrs {
  text: string;
}

function PDFPageButton(props: PDFPageButtonProps) {
  return (
    <Button3D
      name={props.name}
      scale={BUTTON_SCALE}
      width={BUTTON_WIDTH}
      height={BUTTON_HEIGHT}
      type={BUTTON_TYPES.ACTION}
      {...props}
    />
  );
}

const UI_Z = 0.001;
const POSITION_PREV: ArrayVec3 = [-0.45, 0.0, UI_Z];
const POSITION_NEXT: ArrayVec3 = [0.45, 0.0, UI_Z];
const POSITION_LABEL: ArrayVec3 = [0.0, -0.45, UI_Z];
const PAGE_LABEL_COLOR = new Color(0.1, 0.1, 0.1);
export function PDFMenuPrefab() {
  const refPrev = createRef();
  const refNext = createRef();
  const refLabel = createRef();
  return (
    <entity
      name="PDF Menu"
      pdfMenu={{
        prevButtonRef: refPrev,
        nextButtonRef: refNext,
        pageLabelRef: refLabel
      }}
    >
      <PDFPageButton name="Previous Page Button" text="<" ref={refPrev} position={POSITION_PREV} />
      <PDFPageButton name="Next Page Button" text=">" ref={refNext} position={POSITION_NEXT} />
      <Label ref={refLabel} position={POSITION_LABEL} text={{ color: PAGE_LABEL_COLOR }} />
    </entity>
  );
}
