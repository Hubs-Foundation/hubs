/* eslint-disable react/prop-types */
/** @jsx createElementEntity */
import cameraModelSrc from "../assets/camera_tool.glb";
import buttonSrc from "../assets/hud/button.9.png";
import { cloneModelFromCache, loadModel } from "../components/gltf-model-plus";
import { Layers } from "../camera-layers";
import { COLLISION_LAYERS } from "../constants";
import { BUTTON_TYPES } from "../systems/single-action-button-system";
import { createElementEntity, createRef } from "../utils/jsx-entity";
import { textureLoader } from "../utils/media-utils";
import { preload } from "../utils/preload";

const buttonTexture = textureLoader.load(buttonSrc);

// eslint-disable-next-line react/prop-types
export function Button({ text, width, height, texture = buttonTexture, type = BUTTON_TYPES.DEFAULT, ...props }) {
  const labelRef = createRef();
  return (
    <entity
      name={"Button"}
      slice9={{ size: [width, height], insets: [64, 66, 64, 66], texture }}
      cursorRaycastable
      remoteHoverTarget
      hoverButton={{ type }}
      textButton={{ labelRef }}
      singleActionButton
      layers={1 << Layers.CAMERA_LAYER_UI}
      {...props}
    >
      <entity
        ref={labelRef}
        layers={1 << Layers.CAMERA_LAYER_UI}
        text={{ value: text, color: "#000000", textAlign: "center", anchorX: "center", anchorY: "middle" }}
        position={[0, 0, 0.01]}
        name={props.name ? `${props.name} Label` : "Button Label"}
      />
    </entity>
  );
}

// eslint-disable-next-line react/prop-types
export function Label({ text = {}, ...props }, ...children) {
  const value = children.join("\n");
  return <entity name="Label" text={{ value, ...text }} layers={1 << Layers.CAMERA_LAYER_UI} {...props} />;
}

const RENDER_WIDTH = 1280;
const RENDER_HEIGHT = 720;

// We intentionally do not remove this model from the GLTF Cache
preload(loadModel(cameraModelSrc, null, true));

export function CameraPrefab() {
  const snapMenuRef = createRef();
  const nextButtonRef = createRef();
  const prevButtonRef = createRef();
  const snapRef = createRef();
  const cancelRef = createRef();
  const recVideoRef = createRef();
  const screenRef = createRef();
  const selfieScreenRef = createRef();
  const cameraRef = createRef();
  const countdownLblRef = createRef();
  const captureDurLblRef = createRef();
  const sndToggleRef = createRef();

  const screenMaterial = new THREE.MeshBasicMaterial({ toneMapped: false });
  const width = 0.28;
  const aspect = 1280 / 720;
  const screenGeometry = new THREE.PlaneBufferGeometry(width, width / aspect);

  const camera = new THREE.PerspectiveCamera(50, RENDER_WIDTH / RENDER_HEIGHT, 0.1, 30000);
  camera.layers.enable(Layers.CAMERA_LAYER_VIDEO_TEXTURE_TARGET);
  camera.layers.enable(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);

  const buttonHeight = 0.2;
  const buttonScale = [0.4, 0.4, 0.4];
  const smallButtonScale = [0.2, 0.2, 0.2];

  const uiZ = 0.1;

  return (
    <entity
      name="Camera Tool"
      networked
      networkedTransform
      cursorRaycastable
      remoteHoverTarget
      handCollisionTarget
      offersRemoteConstraint
      offersHandConstraint
      makeKinematicOnRelease
      holdable
      rigidbody={{ collisionGroup: COLLISION_LAYERS.INTERACTABLES, collisionMask: COLLISION_LAYERS.HANDS }}
      physicsShape={{ halfExtents: [0.22, 0.14, 0.1] }}
      cameraTool={{
        snapMenuRef,
        nextButtonRef,
        prevButtonRef,
        snapRef,
        cancelRef,
        recVideoRef,
        screenRef,
        selfieScreenRef,
        cameraRef,
        countdownLblRef,
        captureDurLblRef,
        sndToggleRef
      }}
    >
      <entity
        name="Screen"
        object3D={new THREE.Mesh(screenGeometry, screenMaterial)}
        ref={screenRef}
        position={[0, 0, -0.042]}
        rotation={[0, Math.PI, 0]}
      />
      <entity
        name="Selfie Screen"
        ref={selfieScreenRef}
        object3D={new THREE.Mesh(screenGeometry, screenMaterial)}
        position={[0, 0.4, 0]}
        scale={[-2, 2, 2]}
      />

      <entity name="Camera Model" model={{ model: cloneModelFromCache(cameraModelSrc).scene }} scale={[2, 2, 2]} />

      <entity ref={cameraRef} object3D={camera} position={[0, 0, 0.05]} rotation={[0, Math.PI, 0]} />

      <entity name="Snap Menu" ref={snapMenuRef}>
        <Label ref={countdownLblRef} position={[0, 0, uiZ + 0.002]} />
        <Label ref={captureDurLblRef} position={[0, 0, uiZ + 0.002]} />

        <Button
          ref={cancelRef}
          scale={buttonScale}
          position={[0, 0.1, uiZ]}
          width={0.4}
          height={buttonHeight}
          text={"Cancel"}
        />
        <Button
          ref={snapRef}
          scale={buttonScale}
          position={[0, 0.1, uiZ]}
          width={0.4}
          height={buttonHeight}
          type={BUTTON_TYPES.ACTION}
          text={"Photo"}
        />

        <Button
          ref={prevButtonRef}
          scale={smallButtonScale}
          position={[-0.082, 0, uiZ]}
          width={buttonHeight}
          height={buttonHeight}
          text={"<"}
        />
        <Button
          ref={recVideoRef}
          scale={buttonScale}
          position={[0, -0.1, uiZ]}
          width={0.4}
          height={buttonHeight}
          type={BUTTON_TYPES.ACTION}
          text={"Video"}
        />
        <Button
          ref={nextButtonRef}
          scale={smallButtonScale}
          position={[0.082, 0, uiZ]}
          width={buttonHeight}
          height={buttonHeight}
          text={">"}
        />

        <Button
          ref={sndToggleRef}
          scale={smallButtonScale}
          position={[0, -0.17, uiZ]}
          width={0.6}
          height={buttonHeight}
          text={"Sound OFF"}
        />
      </entity>
    </entity>
  );
}

export function CubeMediaFramePrefab() {
  return (
    <entity
      name="Media Frame"
      networked
      networkedTransform
      cursorRaycastable
      remoteHoverTarget
      handCollisionTarget
      offersRemoteConstraint
      offersHandConstraint
      floatyObject
      destroyAtExtremeDistance
      holdable
      rigidbody={{
        gravity: -9.8,
        collisionGroup: COLLISION_LAYERS.INTERACTABLES,
        collisionMask:
          COLLISION_LAYERS.HANDS |
          COLLISION_LAYERS.ENVIRONMENT |
          COLLISION_LAYERS.INTERACTABLES |
          COLLISION_LAYERS.AVATAR
      }}
      physicsShape={{ halfExtents: [0.5, 0.5, 0.5] }}
      object3D={new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshStandardMaterial())}
    >
      <entity mediaFrame position={[0, 1, 0]} />
    </entity>
  );
}
