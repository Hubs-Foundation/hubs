/** @jsx createElementEntity */
import { Color } from "three";
import { ArrayVec3, Attrs, createElementEntity, createRef } from "../utils/jsx-entity";
import { Button3D, BUTTON_TYPES } from "./button3D";
import { Label } from "./camera-tool";

const buttonHeight = 0.2;
const buttonScale: ArrayVec3 = [0.4, 0.4, 0.4];
const buttonWidth = 0.3;

interface PDFPageButtonProps extends Attrs {
  text: string;
}

function PDFPageButton(props: PDFPageButtonProps) {
  return (
    <Button3D
      name={props.name}
      scale={buttonScale}
      width={buttonWidth}
      height={buttonHeight}
      type={BUTTON_TYPES.ACTION}
      {...props}
    />
  );
}

const uiZ = 0.001;
const positionPrev: ArrayVec3 = [-0.45, 0.0, uiZ];
const positionNext: ArrayVec3 = [0.45, 0.0, uiZ];
const positionLabel: ArrayVec3 = [0.0, -0.45, uiZ];
const pageLabelColor = new Color(0.1, 0.1, 0.1);
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
      <PDFPageButton name="Previous Page Button" text="<" ref={refPrev} position={positionPrev} />
      <PDFPageButton name="Next Page Button" text=">" ref={refNext} position={positionNext} />
      <Label ref={refLabel} position={positionLabel} text={{ color: pageLabelColor }} />
    </entity>
  );
}
