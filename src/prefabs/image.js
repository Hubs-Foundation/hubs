/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";

export function Image({ texture, textureSrc, textureVersion, ratio, projection }) {
  return <entity image={{ texture, textureSrc, textureVersion, ratio, projection }} />;
}
