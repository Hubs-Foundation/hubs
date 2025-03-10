/** @jsx createElementEntity */
import { ArrayVec3, Attrs, createElementEntity, createRef } from "../utils/jsx-entity";
import { BUTTON_TYPES, Button3D } from "./button3D";

const BUTTON_HEIGHT = 0.2;
const BUTTON_WIDTH = 0.6;
const BUTTON_SCALE: ArrayVec3 = [1.0, 1.0, 1.0];
const UI_Z = 0.001;
const BUTTON_POSITION: ArrayVec3 = [0, 0, UI_Z];

interface LinkButtonAttrs extends Attrs {
  linkHoverMenuItem: boolean;
}

function LinkButton(props: LinkButtonAttrs) {
  return (
    <Button3D
      name="Link Button"
      height={BUTTON_HEIGHT}
      scale={BUTTON_SCALE}
      text={"open link"}
      type={BUTTON_TYPES.ACTION}
      width={BUTTON_WIDTH}
      {...props}
    />
  );
}

export function LinkHoverMenuPrefab() {
  const buttonRef = createRef();

  return (
    <entity
      name="Link Hover Menu"
      objectMenuTransform
      linkHoverMenu={{
        linkButtonRef: buttonRef
      }}
    >
      <LinkButton ref={buttonRef} position={BUTTON_POSITION} linkHoverMenuItem />
    </entity>
  );
}
