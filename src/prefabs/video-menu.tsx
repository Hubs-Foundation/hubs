/** @jsx createElementEntity */
import { BoxBufferGeometry, Mesh, MeshBasicMaterial, PlaneBufferGeometry } from "three";
import { Button, Label } from "../prefabs/camera-tool";
import { createElementEntity, createRef } from "../utils/jsx-entity";

function Slider({ trackRef, headRef, ...props }: any) {
  return (
    <entity {...props} name="Slider">
      <entity
        name="Slider:Track"
        video-menu-item
        object3D={
          new Mesh(
            new PlaneBufferGeometry(1.0, 0.05),
            new MeshBasicMaterial({ opacity: 0.5, color: 0x000000, transparent: true })
          )
        }
        cursor-raycastable
        remote-hover-target
        holdable
        holdable-button
        ref={trackRef}
      >
        <entity
          is-not-remote-hover-target
          name="Slider:Head"
          object3D={new Mesh(new BoxBufferGeometry(0.05, 0.05, 0.05), new MeshBasicMaterial())}
          ref={headRef}
        />
      </entity>
    </entity>
  );
}

export function VideoMenuPrefab() {
  const uiZ = 0.001;
  const timeLabelRef = createRef();
  const headRef = createRef();
  const trackRef = createRef();
  const halfHeight = 9 / 16 / 2;

  return (
    <entity name="Video Menu" video-menu={{ timeLabelRef, headRef, trackRef }}>
      <Label
        name="Time Label"
        text={{ anchorY: "top", anchorX: "right" }}
        ref={timeLabelRef}
        scale={[0.5, 0.5, 0.5]}
        position={[0.5 - 0.02, halfHeight - 0.02, uiZ]}
      />
      <Slider trackRef={trackRef} headRef={headRef} position={[0, -halfHeight + 0.025, uiZ]} />
    </entity>
  );
}
