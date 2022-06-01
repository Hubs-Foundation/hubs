import { renderAsAframeEntity, createElementEntity, createRef } from "../utils/jsx-entity";
/** @jsx createElementEntity */

import { getThemeColor } from "../utils/theme";

const actionColor = getThemeColor("action-color");
const actionHoverColor = getThemeColor("action-color-highlight");
const buttonStyles = {
  "rounded-button": {
    slice9: {
      width: 0.2,
      height: 0.2,
      left: 64,
      top: 64,
      right: 66,
      bottom: 66,
      transparent: false,
      alphaTest: 0.1,
      src: "button"
    },
    "text-button": {
      textHoverColor: actionHoverColor,
      textColor: actionColor,
      backgroundColor: "#fff",
      backgroundHoverColor: "#aaa"
    }
  },
  "rounded-action-button": {
    slice9: {
      width: 0.2,
      height: 0.2,
      left: 64,
      top: 64,
      right: 66,
      bottom: 66,
      transparent: false,
      alphaTest: 0.1,
      src: "action-button"
    },
    "text-button": {
      textHoverColor: "#fff",
      textColor: "#fff",
      backgroundColor: actionColor,
      backgroundHoverColor: actionHoverColor
    }
  }
};

function ActionButton({
  image,
  hoverImage = image,
  type = "rounded-button",
  iconScale = 0.075,
  iconClassName,
  ...props
}) {
  return (
    <a-entity {...buttonStyles[type]} is-remote-hover-target tags="singleActionButton: true;" {...props}>
      {image && (
        <a-entity
          sprite
          className={iconClassName}
          icon-button={{ image, hoverImage }}
          scale={[iconScale, iconScale, iconScale]}
          position={[0, 0, 0.001]}
        />
      )}
    </a-entity>
  );
}

function RecordButton() {
  return (
    <a-entity
      className="record-button"
      is-remote-hover-target
      tags={{ singleActionButton: true }}
      position={[0, -0.15, 0.075]}
      scale={[0.75, 0.75, 0.75]}
      {...buttonStyles["rounded-action-button"]}
    >
      <a-entity
        sprite=""
        className="record-icon"
        icon-button={{ image: "record-action.png", hoverImage: "record-action.png" }}
        scale={[0.175, 0.175, 0.175]}
        position={[0, 0, 0.001]}
      />
      <a-entity
        sprite
        className="record-alpha-icon"
        icon-button={{ image: "record-action-alpha.png", hoverImage: "record-action-alpha.png" }}
        scale={[0.175, 0.175, 0.175]}
        position={[0, 0, 0.001]}
      />
    </a-entity>
  );
}

function InteractableCamera() {
  const labelRef = createRef();
  const snapButtonRef = createRef();
  const snapMenuRef = createRef();

  const screenRef = createRef();
  const selfieScreenRef = createRef();

  const screenMaterial = new THREE.MeshBasicMaterial({ toneMapped: false });

  const width = 0.28;
  const aspect = 1280 / 720;
  const screenGeometry = new THREE.PlaneBufferGeometry(width, width / aspect);

  return (
    <a-entity
      className="interactable"
      body-helper={{ type: "dynamic", mass: "0.001", collisionFilterGroup: "1", collisionFilterMask: "8" }}
      camera-tool={{ labelRef, snapButtonRef, snapMenuRef, screenRef, selfieScreenRef }}
      is-remote-hover-target
      tags={{ isHandCollisionTarget: true, isHoldable: true, offersHandConstraint: true, offersRemoteConstraint: true }}
      matrix-auto-update
      shape-helper={{ type: "box", fit: "manual", halfExtents: "0.22 0.14 0.1", offset: "0  0.02 0" }}
      floaty-object={{ autoLockOnRelease: true, autoLockOnLoad: true }}
      owned-object-limiter={{ counter: "#camera-counter" }}
      set-unowned-body-kinematic
      scalable-when-grabbed
      position-at-border={{ target: ".camera-menu", isFlat: true }}
      set-yxz-order
    >
      <entity ref={cameraRef} camera={layers} rotation={rotation} position={position} />

      <entity object3D={loadGLTF(src)} />

      <THREE.Mesh
        name="screen"
        ref={screenRef}
        geometry={screenGeometry}
        material={screenMaterial}
        position={[0, 0, -0.042]}
        rotation={[0, Math.PI, 0]}
      />

      <THREE.Mesh
        name="selfie screen"
        ref={selfieScreenRef}
        geometry={screenGeometry}
        material={screenMaterial}
        position={[0, 0.4, 0]}
        scale={[-2, 2, 2]}
      />

      <a-entity className="ui interactable-ui" ref={snapMenuRef}>
        <a-entity
          ref={labelRef}
          position={[0, 0.15, 0.081]}
          text={{ value: 3, textAlign: "center", color: "#fafafa", fontSize: 0.09 }}
        />
        <ActionButton
          className="label-action-background"
          type="rounded-action-button"
          position={[0, 0.15, 0.08]}
          scale={[0.75, 0.75, 0.75]}
        />
        <ActionButton className="label-background" position={[0, 0.15, 0.08]} scale={[0.75, 0.75, 0.75]} />
        <a-entity
          className="duration"
          text="value: 5s; textAlign: center; color: #fafafa; fontSize: 0.09;"
          position={[0, -0.15, 0.09]}
        />
        <ActionButton
          ref={snapButtonRef}
          type="rounded-action-button"
          image="snap_camera.png"
          position={[0, 0.15, 0.08]}
          scale={[0.75, 0.75, 0.75]}
          iconScale={0.2}
        />
        <RecordButton />
        <ActionButton
          className="cancel-button"
          image="close-action.png"
          position={[0, -0.15, 0.075]}
          scale={[0.65, 0.65, 0.65]}
        />
        <ActionButton
          className="prev-duration"
          image="prev.png"
          position={[-0.135, -0.15, 0.075]}
          scale={[0.5, 0.5, 0.5]}
        />
        <ActionButton
          className="next-duration"
          image="next.png"
          position={[0.135, -0.15, 0.075]}
          scale={[0.5, 0.5, 0.5]}
        />
        <ActionButton
          className="stop-button"
          type="rounded-action-button"
          position={[0, 0.15, 0.08]}
          scale={[0.75, 0.75, 0.75]}
          image="stop-action.png"
        />
      </a-entity>
      <a-entity
        className="ui interactable-ui camera-menu"
        visibility-while-frozen={{ withinDistance: 100, withPermission: "spawn_camera" }}
      >
        <ActionButton
          type="rounded-action-button"
          className="capture-audio"
          iconClassName="capture-audio-icon"
          position={[0, 0.125, 0.001]}
          image="unmute-action.png"
          iconScale={0.165}
        />
        <ActionButton
          type="rounded-action-button"
          transform-button="mode: align;"
          position={[-0.15, -0.125, 0.001]}
          image="recenter-action.png"
          iconScale={0.165}
        />
        <ActionButton
          type="rounded-action-button"
          tags="isHoldable: true; holdableButton: true;"
          transform-button
          transform-button-selector
          position={[0.15, -0.125, 0.001]}
          image="rotate-action.png"
          iconScale={0.165}
        />
        <ActionButton
          remove-networked-object-button
          position={[0, -0.35, 0.001]}
          iconScale={0.165}
          image="remove-action.png"
        />
      </a-entity>
    </a-entity>
  );
}

export default {
  template: "#interactable-camera",
  addEntity: function() {
    const c = <InteractableCamera />;
    console.log(c);
    return renderAsAframeEntity(c);
  },
  components: [
    "position",
    "rotation",
    {
      component: "camera-tool",
      property: "isSnapping"
    },
    {
      component: "camera-tool",
      property: "isRecording"
    },
    {
      component: "camera-tool",
      property: "label"
    }
  ]
};

import { MediaType, textureLoader } from "../utils/media-utils";

import buttonSrc from "../assets/hud/button.9.png";
const buttonTexture = textureLoader.load(buttonSrc);

function Button({ text, width, height, texture = buttonTexture, ...props }) {
  const labelRef = createRef();
  return (
    <entity
      slice9={{ size: [width, height], insets: [64, 66, 64, 66], texture }}
      cursor-raycastable
      remote-hover-target
      single-action-button
      text-button={{ labelRef }}
      {...props}
    >
      <entity
        ref={labelRef}
        text={{ value: text, color: "#000000", textAlign: "center", anchorX: "center", anchorY: "middle" }}
        position={[0, 0, 0.01]}
      />
    </entity>
  );
}

function HoldableButton({ text, width, height, texture = buttonTexture, ...props }) {
  return (
    <entity
      slice9={{ size: [width, height], insets: [64, 66, 64, 66], texture }}
      cursor-raycastable
      remote-hover-target
      holdable
      holdable-button
      {...props}
    >
      <entity
        text={{ value: text, color: "#cc22cc", textAlign: "center", anchorX: "center", anchorY: "middle" }}
        position={[0, 0, 0.01]}
      />
    </entity>
  );
}

import { loadModel } from "../components/gltf-model-plus";
import cameraModelSrc from "../assets/camera_tool.glb";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { cloneObject3D } from "../utils/three-utils";

let model;
(async () => {
  model = await waitForDOMContentLoaded().then(() => loadModel(cameraModelSrc));
})();

const RENDER_WIDTH = 1280;
const RENDER_HEIGHT = 720;

import { Layers } from "../components/layers";

export function CameraPrefab(_props) {
  // TODO: What if model didn't load yet?
  const mesh = cloneObject3D(model.scene);

  const snapRef = createRef();
  const recVideoRef = createRef();
  const button_next = createRef();
  const button_prev = createRef();

  const countdownLblRef = createRef();
  const captureDurLblRef = createRef();

  const scale = 4;

  const screenRef = createRef();
  const selfieScreenRef = createRef();

  const screenMaterial = new THREE.MeshBasicMaterial({ toneMapped: false });

  const width = 0.28;
  const aspect = 1280 / 720;
  const screenGeometry = new THREE.PlaneBufferGeometry(width, width / aspect);

  const cameraRef = createRef();
  const camera = new THREE.PerspectiveCamera(50, RENDER_WIDTH / RENDER_HEIGHT, 0.1, 30000);
  camera.layers.enable(Layers.CAMERA_LAYER_VIDEO_TEXTURE_TARGET);
  camera.layers.enable(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);
  camera.rotation.set(0, Math.PI, 0);
  camera.position.set(0, 0, 0.05);
  camera.matrixNeedsUpdate = true;

  const uiZ = 0.1;

  return (
    <entity
      networked
      networked-transform
      cursor-raycastable
      remote-hover-target
      offers-remote-constraint
      holdable
      rigidbody
      physics-shape={{ halfExtents: [0.22, 0.14, 0.1] }}
      camera-tool={{
        snapRef,
        button_next,
        button_prev,
        screenRef,
        selfieScreenRef,
        cameraRef,
        countdownLblRef,
        captureDurLblRef,
        recVideoRef
      }}
    >
      <entity
        object3D={new THREE.Mesh(screenGeometry, screenMaterial)}
        ref={screenRef}
        position={[0, 0, -0.042]}
        rotation={[0, Math.PI, 0]}
      />
      <entity
        ref={selfieScreenRef}
        object3D={new THREE.Mesh(screenGeometry, screenMaterial)}
        position={[0, 0.4, 0]}
        scale={[-2, 2, 2]}
      />

      <entity object3D={mesh} scale={[2, 2, 2]} />

      <entity ref={cameraRef} object3D={camera} position={[0, 0, 0.05]} rotation={[0, Math.PI, 0]} />

      <Button
        ref={snapRef}
        scale={[1 / scale, 1 / scale, 1 / scale]}
        position={[0, 0.1, uiZ]}
        width={0.6}
        height={0.3}
        text={"Snap"}
      />
      <entity ref={countdownLblRef} text position={[0, 0.2, uiZ]} />

      <Button
        ref={button_next}
        scale={[1 / scale, 1 / scale, 1 / scale]}
        position={[1 / scale, -0.1, uiZ]}
        width={0.6}
        height={0.3}
        text={"Next"}
      />

      <entity ref={captureDurLblRef} text position={[0, -0.2, uiZ]} />

      <Button
        ref={recVideoRef}
        scale={[1 / scale, 1 / scale, 1 / scale]}
        position={[0, -0.1, uiZ]}
        width={0.6}
        height={0.3}
        text={"Rec"}
      />

      <Button
        ref={button_prev}
        scale={[1 / scale, 1 / scale, 1 / scale]}
        position={[-1 / scale, -0.1, uiZ]}
        width={0.6}
        height={0.3}
        text={"Prev"}
      />
    </entity>
  );

  // return (
  //   <entity networked-transform logger={{ buttons }}>
  //     <HoldableButton position={[0, 1, 0]} width={1} height={0.5} text="Welcome to our wonderfully grabbable world" />
  //     {buttons}
  //     <entity
  //       scale={[0.25, 0.25, 0.25]}
  //       object3D={cube}
  //       cursor-raycastable
  //       remote-hover-target
  //       offers-remote-constraint
  //       holdable
  //       rigidbody
  //     />
  //   </entity>
  // );
}

export const FLAGS = {
  captureAudio: 1,
  showCameraViewfinder: 1 << 1
};

export const STATES = {
  isDoingNothing: 0,
  isSnapping: 1,
  isRecording: 2
};

// Data on a camera
// label, snapButton, snapMenu, screen, selfieScreen
// renderTarget, camera
