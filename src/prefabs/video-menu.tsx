/** @jsx createElementEntity */
import { createElementEntity, createRef } from "../utils/jsx-entity";
import { Button } from "../prefabs/camera-tool";
export function VideoMenuPrefab() {
  const uiZ = 0.1;
  const playButtonRef = createRef();
  return (
    <entity video-menu={{ playButtonRef }}>
      <Button video-menu-button cursor-raycastable remote-hover-target ref={playButtonRef} position={[0, 0, uiZ]} width={0.4} height={0.4} text={"Play"} />
    </entity>
  );
}
