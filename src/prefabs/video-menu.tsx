/** @jsx createElementEntity */
import { BoxBufferGeometry, Mesh, MeshBasicMaterial, PlaneBufferGeometry } from "three";
import { Button, Label } from "../prefabs/camera-tool";
import { createElementEntity, createRef } from "../utils/jsx-entity";

function Slider({ trackRef, headRef, ...props }: any) {
  return (
    <entity {...props}>
      <entity
        name="Track"
        video-menu-item
        object3D={
          new Mesh(new PlaneBufferGeometry(1.0, 0.1), new MeshBasicMaterial({ opacity: 0.50, color: 0x333333, transparent: true }))
        }
        cursor-raycastable
        remote-hover-target
        holdable
        holdable-button
        ref={trackRef}
      >
        <entity object3D={new Mesh(new BoxBufferGeometry(0.1, 0.1, 0.05), new MeshBasicMaterial())} ref={headRef} />
      </entity>
    </entity>
  );
}

export function VideoMenuPrefab() {
  const uiZ = 0.01;
  const playButtonRef = createRef();
  const timeLabelRef = createRef();
  const headRef = createRef();
  const trackRef = createRef();
  return (
    <entity video-menu={{ playButtonRef, timeLabelRef, headRef, trackRef }}>
      <Button ref={playButtonRef} video-menu-item position={[0, 0, uiZ]} width={0.3} height={0.2} text="Play" />
      <Label ref={timeLabelRef} scale={[1, 1, 1]} position={[-0.2, -0.15, uiZ]} />
      <Slider trackRef={trackRef} headRef={headRef} position={[0, -0.22, uiZ]} />
    </entity>
  );
}
