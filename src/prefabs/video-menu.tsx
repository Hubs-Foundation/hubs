/** @jsx createElementEntity */
import { createElementEntity, createRef } from "../utils/jsx-entity";
import { Button, Label } from "../prefabs/camera-tool";
export function VideoMenuPrefab() {
  const uiZ = 0.1;
  const playButtonRef = createRef();
  const currentTimeRef = createRef();
  const durationRef = createRef();
  return (
    <entity video-menu={{ playButtonRef, currentTimeRef, durationRef }}>
      <Button ref={playButtonRef} video-menu-item position={[0, 0, uiZ]} width={0.4} height={0.4} text="Play" />
      <Label ref={currentTimeRef} scale={[1, 1, 1]} position={[-0.3, -0.25, uiZ]} />
      <Label text={{ value: "/" }} scale={[1, 1, 1]} position={[-0.15, -0.25, uiZ]} />
      <Label ref={durationRef} scale={[1, 1, 1]} position={[-0.0, -0.25, uiZ]} />
    </entity>
  );
}
