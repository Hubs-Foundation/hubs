/* eslint-disable react/prop-types */
/* eslint-disable react/no-unknown-property */
/** @jsx createElementEntity */
import cameraModelSrc from "../assets/camera_tool.glb";
import { Layers } from "../camera-layers";
import { cloneModelFromCache, loadModel } from "../components/gltf-model-plus";
import { COLLISION_LAYERS } from "../constants";
import { Fit, Shape } from "../inflators/physics-shape";
import { createElementEntity, createRef } from "../utils/jsx-entity";
import { preload } from "../utils/preload";
import { Button3D, BUTTON_TYPES } from "./button3D";

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
      floatyObject
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

        <Button3D
          ref={cancelRef}
          scale={buttonScale}
          position={[0, 0.1, uiZ]}
          width={0.4}
          height={buttonHeight}
          text={"Cancel"}
        />
        <Button3D
          ref={snapRef}
          scale={buttonScale}
          position={[0, 0.1, uiZ]}
          width={0.4}
          height={buttonHeight}
          type={BUTTON_TYPES.ACTION}
          text={"Photo"}
        />

        <Button3D
          ref={prevButtonRef}
          scale={smallButtonScale}
          position={[-0.082, 0, uiZ]}
          width={buttonHeight}
          height={buttonHeight}
          text={"<"}
        />
        <Button3D
          ref={recVideoRef}
          scale={buttonScale}
          position={[0, -0.1, uiZ]}
          width={0.4}
          height={buttonHeight}
          type={BUTTON_TYPES.ACTION}
          text={"Video"}
        />
        <Button3D
          ref={nextButtonRef}
          scale={smallButtonScale}
          position={[0.082, 0, uiZ]}
          width={buttonHeight}
          height={buttonHeight}
          text={">"}
        />

        <Button3D
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
      physicsShape={{ fit: Fit.MANUAL, type: Shape.BOX, halfExtents: [0.5, 0.5, 0.5] }}
      object3D={new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshStandardMaterial())}
      deletable
      hoverableVisuals
    >
      <entity mediaFrame position={[0, 1, 0]} />
    </entity>
  );
}
