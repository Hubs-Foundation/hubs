/** @jsx createElementEntity */

import cameraModelSrc from "../assets/camera_tool.glb";
import buttonSrc from "../assets/hud/button.9.png";
import { loadModel } from "../components/gltf-model-plus";
import { Layers } from "../components/layers";
import { BUTTON_TYPES } from "../systems/single-action-button-system";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { createElementEntity, createRef } from "../utils/jsx-entity";
import { textureLoader } from "../utils/media-utils";
import { cloneObject3D } from "../utils/three-utils";

const buttonTexture = textureLoader.load(buttonSrc);

function Button({ text, width, height, texture = buttonTexture, type = BUTTON_TYPES.DEFAULT, ...props }) {
  const labelRef = createRef();
  return (
    <entity
      slice9={{ size: [width, height], insets: [64, 66, 64, 66], texture }}
      cursor-raycastable
      remote-hover-target
      hover-button={{ type }}
      text-button={{ labelRef }}
      single-action-button
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

let model;
(async () => {
  model = await waitForDOMContentLoaded().then(() => loadModel(cameraModelSrc));
})();

const RENDER_WIDTH = 1280;
const RENDER_HEIGHT = 720;

export function CameraPrefab(_props) {
  // TODO: What if model didn't load yet?
  const cameraModel = cloneObject3D(model.scene);

  const snapRef = createRef();
  const cancelRef = createRef();
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
        cancelRef,
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

      <entity object3D={cameraModel} scale={[2, 2, 2]} />

      <entity ref={cameraRef} object3D={camera} position={[0, 0, 0.05]} rotation={[0, Math.PI, 0]} />

      <Button
        ref={cancelRef}
        scale={[1 / scale, 1 / scale, 1 / scale]}
        position={[0, 0.1, uiZ]}
        width={0.6}
        height={0.3}
        text={"Cancel"}
      />
      <Button
        ref={snapRef}
        scale={[1 / scale, 1 / scale, 1 / scale]}
        position={[0, 0.1, uiZ]}
        width={0.6}
        height={0.3}
        type={BUTTON_TYPES.ACTION}
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
}
