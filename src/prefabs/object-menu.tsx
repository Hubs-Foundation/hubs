/** @jsx createElementEntity */
import { ArrayVec3, Attrs, createElementEntity, createRef } from "../utils/jsx-entity";
import { Button3D, BUTTON_TYPES } from "./button3D";

const buttonHeight = 0.2;
const buttonScale: ArrayVec3 = [0.4, 0.4, 0.4];
const smallButtonScale: ArrayVec3 = [0.2, 0.2, 0.2];
const uiZ = 0.25;

function PinButton(props: Attrs) {
  return (
    <Button3D
      name="Pin Button"
      scale={buttonScale}
      width={0.4}
      height={buttonHeight}
      type={BUTTON_TYPES.ACTION}
      text={"pin"}
      {...props}
    />
  );
}

function UnpinButton(props: Attrs) {
  return (
    <Button3D
      name="Unpin Button"
      scale={buttonScale}
      width={0.4}
      height={buttonHeight}
      type={BUTTON_TYPES.ACTION}
      text={"unpin"}
      {...props}
    />
  );
}

function CameraFocusButton(props: Attrs) {
  return (
    <Button3D
      name="Camera Focus Button"
      scale={buttonScale}
      width={0.4}
      height={buttonHeight}
      type={BUTTON_TYPES.DEFAULT}
      text={"focus"}
      {...props}
    />
  );
}

function CameraTrackButton(props: Attrs) {
  return (
    <Button3D
      name="Camera Track Button"
      scale={buttonScale}
      width={0.4}
      height={buttonHeight}
      type={BUTTON_TYPES.DEFAULT}
      text={"track"}
      {...props}
    />
  );
}

function RemoveButton(props: Attrs) {
  return (
    <Button3D
      name="Remove Button"
      scale={buttonScale}
      width={0.4}
      height={buttonHeight}
      type={BUTTON_TYPES.DEFAULT}
      text={"delete"}
      {...props}
    />
  );
}

function DropButton(props: Attrs) {
  return (
    <Button3D
      name="Drop Button"
      scale={buttonScale}
      width={0.4}
      height={buttonHeight}
      type={BUTTON_TYPES.DEFAULT}
      text={"drop"}
      {...props}
    />
  );
}

function InspectButton(props: Attrs) {
  return (
    <Button3D
      name="Inspect Button"
      scale={buttonScale}
      width={0.4}
      height={buttonHeight}
      type={BUTTON_TYPES.DEFAULT}
      text={"inspect"}
      {...props}
    />
  );
}

function DeserializeDrawingButton(props: Attrs) {
  return (
    <Button3D
      name="Deserialize Drawing Button"
      scale={buttonScale}
      width={0.4}
      height={buttonHeight}
      type={BUTTON_TYPES.DEFAULT}
      text={"deserialize"}
      {...props}
    />
  );
}

function OpenLinkButton(props: Attrs) {
  return (
    <Button3D
      name="Open Link Button"
      scale={buttonScale}
      width={0.4}
      height={buttonHeight}
      type={BUTTON_TYPES.DEFAULT}
      text={"open link"}
      {...props}
    />
  );
}

function RefreshButton(props: Attrs) {
  return (
    <Button3D
      name="Refresh Button"
      scale={buttonScale}
      width={0.4}
      height={buttonHeight}
      type={BUTTON_TYPES.DEFAULT}
      text={"refresh"}
      {...props}
    />
  );
}

function CloneButton(props: Attrs) {
  return (
    <Button3D
      name="Clone Button"
      scale={buttonScale}
      width={0.4}
      height={buttonHeight}
      type={BUTTON_TYPES.DEFAULT}
      text={"clone"}
      {...props}
    />
  );
}

function RotateButton(props: Attrs) {
  return (
    <Button3D
      name="Rotate Button"
      scale={buttonScale}
      width={0.4}
      height={buttonHeight}
      type={BUTTON_TYPES.ACTION}
      text={"rotate"}
      {...props}
    />
  );
}

function MirrorButton(props: Attrs) {
  return (
    <Button3D
      name="Mirror Button"
      scale={buttonScale}
      width={0.4}
      height={buttonHeight}
      type={BUTTON_TYPES.ACTION}
      text={"mirror"}
      {...props}
    />
  );
}

function ScaleButton(props: Attrs) {
  return (
    <Button3D
      name="Scale Button"
      scale={buttonScale}
      width={0.4}
      height={buttonHeight}
      type={BUTTON_TYPES.ACTION}
      text={"scale"}
      {...props}
    />
  );
}

// prettier-ignore
const position = {
  pin:                [    0,  0.125, uiZ] as ArrayVec3,
  unpin:              [    0,  0.125, uiZ] as ArrayVec3,
  focus:              [-0.25,  0.375, uiZ] as ArrayVec3,
  track:              [ 0.25,  0.375, uiZ] as ArrayVec3,
  remove:             [    0, -0.375, uiZ] as ArrayVec3,
  drop:               [    0, -0.625, uiZ] as ArrayVec3,
  inspect:            [    0, -0.625, uiZ] as ArrayVec3,
  deserializeDrawing: [ -0.3, -0.625, uiZ] as ArrayVec3,
  openLink:           [ 0.43, -0.375, uiZ] as ArrayVec3,
  refresh:            [ 0.43,   -0.6, uiZ] as ArrayVec3,
  clone:              [-0.43, -0.375, uiZ] as ArrayVec3,
  rotate:             [ -0.3, -0.125, uiZ] as ArrayVec3,
  mirror:             [    0, -0.125, uiZ] as ArrayVec3,
  scale:              [  0.3, -0.125, uiZ] as ArrayVec3,
};

export function ObjectMenuPrefab() {
  const refs = {
    pin: createRef(),
    unpin: createRef(),
    focus: createRef(),
    track: createRef(),
    remove: createRef(),
    drop: createRef(),
    inspect: createRef(),
    deserializeDrawing: createRef(),
    openLink: createRef(),
    refresh: createRef(),
    clone: createRef(),
    rotate: createRef(),
    mirror: createRef(),
    scale: createRef()
  };

  return (
    <entity
      name="Interactable Object Menu"
      objectMenu={{
        pinButtonRef: refs.pin,
        unpinButtonRef: refs.unpin,
        cameraFocusButtonRef: refs.focus,
        cameraTrackButtonRef: refs.track,
        removeButtonRef: refs.remove,
        dropButtonRef: refs.drop,
        inspectButtonRef: refs.inspect,
        deserializeDrawingButtonRef: refs.deserializeDrawing,
        openLinkButtonRef: refs.openLink,
        refreshButtonRef: refs.refresh,
        cloneButtonRef: refs.clone,
        rotateButtonRef: refs.rotate,
        mirrorButtonRef: refs.mirror,
        scaleButtonRef: refs.scale
      }}
    >
      <PinButton ref={refs.pin} position={position.pin} />
      <UnpinButton ref={refs.unpin} position={position.unpin} />
      <CameraFocusButton ref={refs.focus} position={position.focus} />
      <CameraTrackButton ref={refs.track} position={position.track} />
      <RemoveButton ref={refs.remove} position={position.remove} />
      <DropButton ref={refs.drop} position={position.drop} />
      <InspectButton ref={refs.inspect} position={position.inspect} />
      <DeserializeDrawingButton ref={refs.deserializeDrawing} position={position.deserializeDrawing} />
      <OpenLinkButton ref={refs.openLink} position={position.openLink} />
      <RefreshButton ref={refs.refresh} position={position.refresh} />
      <CloneButton ref={refs.clone} position={position.clone} />
      <RotateButton ref={refs.rotate} position={position.rotate} />
      <MirrorButton ref={refs.mirror} position={position.mirror} />
      <ScaleButton ref={refs.scale} position={position.scale} />
    </entity>
  );
}

// ui interactable-ui
// layers mask 768
// withPermission: spawn_and_move_media

// pinButtonTip: Pinning will broadcast this object to Discord.

// sprite camera-action.png
// cameraFocusLabel focus

// sprite camera-action.png
// cameraTrackLabel track

// sprite remove-action.png
//

// visibility on content types:
// "contentTypes: video/ audio/ image/ application/vnd.apple.mpegurl application/x-mpegurl application/pdf; visible: false;"
// sprite drop-action.png
// hide-when-pinned-and-forbidden

// holdable
// sprite focus-action.png
// visibility-on-content-types="contentTypes: video/ audio/ image/ application/vnd.apple.mpegurl application/x-mpegurl application/pdf;"

// sprite deserialize-action.png
// class="deserialize-drawing" : lookup what else is using this

// text: open link

// text: refresh

// text: clone

// sprite: rotate-action.png
// hide-when-pinned-and-forbidden

// sprite: inspect-action.png
// visibility-on-content-types="contentTypes: video/ audio/ image/ application/vnd.apple.mpegurl application/x-mpegurl application/pdf;"

// sprite: scale-action.png
// hide-when-pinned-and-forbidden

// unprivileged menu...
// refreshButton
// openLinkButton
// mirrorMediaButton
// inspectButton
