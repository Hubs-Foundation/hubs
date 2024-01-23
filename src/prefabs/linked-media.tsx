/** @jsx createElementEntity */
import { createElementEntity, EntityDef } from "../utils/jsx-entity";
import { MediaLoaderParams } from "../inflators/media-loader";

export function LinkedMediaPrefab(params: MediaLoaderParams): EntityDef {
  return <entity name="Linked Media" mediaLoader={params} deletable scale={[1, 1, 1]} />;
}
