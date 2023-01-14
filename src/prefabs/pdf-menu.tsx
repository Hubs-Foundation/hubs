/** @jsx createElementEntity */
import { Color } from "three";
import { ArrayVec3, Attrs, createElementEntity, createRef } from "../utils/jsx-entity";
import { Button3D, BUTTON_TYPES } from "./button3D";
import { Label } from "./camera-tool";

const buttonHeight = 0.2;
const buttonScale: ArrayVec3 = [0.4, 0.4, 0.4];
const buttonWidth = 0.3;

function PreviousPageButton(props: Attrs) {
  return (
    <Button3D
      name="Previous Page Button"
      scale={buttonScale}
      width={buttonWidth}
      height={buttonHeight}
      type={BUTTON_TYPES.ACTION}
      text={"<"}
      {...props}
    />
  );
}

function NextPageButton(props: Attrs) {
  return (
    <Button3D
      name="Next Page Button"
      scale={buttonScale}
      width={buttonWidth}
      height={buttonHeight}
      type={BUTTON_TYPES.ACTION}
      text={">"}
      {...props}
    />
  );
}

const uiZ = 0.001;
// prettier-ignore
const position = {
  prev:  [-0.45,  0.0 , uiZ] as ArrayVec3,
  next:  [ 0.45,  0.0 , uiZ] as ArrayVec3,
  label: [ 0.0 , -0.45, uiZ] as ArrayVec3,
};

const pageLabelColor = new Color(0.1, 0.1, 0.1);

export function PDFMenuPrefab() {
  const refs = {
    prev: createRef(),
    next: createRef(),
    label: createRef()
  };

  return (
    <entity
      name="PDF Menu"
      pdfMenu={{
        prevButtonRef: refs.prev,
        nextButtonRef: refs.next,
        pageLabelRef: refs.label
      }}
    >
      <PreviousPageButton ref={refs.prev} position={position.prev} />
      <NextPageButton ref={refs.next} position={position.next} />
      <Label ref={refs.label} position={position.label} text={{ color: pageLabelColor }} />
    </entity>
  );
}
