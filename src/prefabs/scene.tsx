/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";

export function ScenePrefab(src: string) {
  return <entity name="Scene" sceneRoot sceneLoader={{ src }} />;
}
