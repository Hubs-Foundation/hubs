import { createElementEntity, createRef } from "../utils/jsx-entity";
/** @jsx createElementEntity */

import { renderAsAframeEntity } from "../utils/jsx-entity";
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
    <entity {...buttonStyles[type]} is-remote-hover-target tags="singleActionButton: true;" {...props}>
      {image && (
        <entity
          sprite
          className={iconClassName}
          icon-button={{ image, hoverImage }}
          scale={[iconScale, iconScale, iconScale]}
          position={[0, 0, 0.001]}
        />
      )}
    </entity>
  );
}

function RecordButton() {
  return (
    <entity
      className="record-button"
      is-remote-hover-target
      tags={{ singleActionButton: true }}
      position={[0, -0.15, 0.075]}
      scale={[0.75, 0.75, 0.75]}
      {...buttonStyles["rounded-action-button"]}
    >
      <entity
        sprite=""
        className="record-icon"
        icon-button={{ image: "record-action.png", hoverImage: "record-action.png" }}
        scale={[0.175, 0.175, 0.175]}
        position={[0, 0, 0.001]}
      />
      <entity
        sprite
        className="record-alpha-icon"
        icon-button={{ image: "record-action-alpha.png", hoverImage: "record-action-alpha.png" }}
        scale={[0.175, 0.175, 0.175]}
        position={[0, 0, 0.001]}
      />
    </entity>
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
    <entity
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

      <entity className="ui interactable-ui" ref={snapMenuRef}>
        <entity
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
        <entity
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
      </entity>
      <entity
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
      </entity>
    </entity>
  );
}

export default {
  template: "#interactable-camera",
  createEntity: function() {
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
