/** @jsx createElementEntity */
import { ArrayVec3, Attrs, createElementEntity, createRef } from "../utils/jsx-entity";
import { loadTexture, loadTextureFromCache } from "../utils/load-texture";
import { Button3D, BUTTON_TYPES } from "./button3D";
import closeIconSrc from "../assets/close-action.png";

export async function loadMirrorMenuButtonIcons() {
  return Promise.all([loadTexture(closeIconSrc, 1, "image/png")]);
}

const buttonHeight = 0.2;
const buttonScale: ArrayVec3 = [0.65, 0.65, 0.65];

function CloseButton(props: Attrs) {
  const { texture, cacheKey } = loadTextureFromCache(closeIconSrc, 1);
  return (
    <Button3D
      name="Close Button"
      scale={buttonScale}
      width={buttonHeight}
      height={buttonHeight}
      type={BUTTON_TYPES.DEFAULT}
      icon={{ texture, cacheKey, scale: [0.075, 0.075, 0.075] }}
      {...props}
    />
  );
}

// prettier-ignore
const position = {
  close:          [0, -0.40,   0.001] as ArrayVec3,
  mirrorTarget:   [0,     0,  -0.075] as ArrayVec3, 
};

export function MirrorMenuPrefab() {
  const refs = {
    close: createRef(),
    mirrorTarget: createRef()
  };

  return (
    <entity
      name="Media Mirror Menu"
      mirrorMenu={{
        closeRef: refs.close,
        mirrorTargetRef: refs.mirrorTarget
      }}
      followInFov={{ offset: [0, 0, -0.8], angle: 39 }}
    >
      <CloseButton ref={refs.close} position={position.close} />
      <entity name="Mirror Target" ref={refs.mirrorTarget} position={position.mirrorTarget} />
    </entity>
  );
}
