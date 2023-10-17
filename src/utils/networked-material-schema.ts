import { NetworkedMaterial } from "../bit-components";
import { defineNetworkSchema } from "./define-network-schema";
import { deserializerWithMigrations, Migration, NetworkSchema, read, StoredComponent, write } from "./network-schemas";
import type { EntityID } from "./networking-types";

const migrations = new Map<number, Migration>();

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version !== 1) return false;

  const {
    color,
    mapNid,
    opacity,
    alphaMapNid,
    emissive,
    emissiveMapNid,
    emissiveIntensity,
    roughnessMapNid,
    roughness,
    metalnessMapNid,
    metalness,
    lightMapNid,
    lightMapIntensity,
    aoMapNid,
    aoMapIntensity,
    normalMapNid,
    alphaTest,
    flags
  }: {
    color: string;
    mapNid: string;
    opacity: number;
    alphaMapNid: string;
    emissive: string;
    emissiveMapNid: string;
    emissiveIntensity: number;
    roughnessMapNid: string;
    roughness: number;
    metalnessMapNid: string;
    metalness: number;
    lightMapNid: string;
    lightMapIntensity: number;
    aoMapNid: string;
    aoMapIntensity: number;
    normalMapNid: string;
    alphaTest: number;
    flags: number;
  } = data;
  write(NetworkedMaterial.color, eid, APP.getSid(color));
  write(NetworkedMaterial.mapNid, eid, APP.getSid(mapNid));
  write(NetworkedMaterial.opacity, eid, opacity);
  write(NetworkedMaterial.alphaMapNid, eid, APP.getSid(alphaMapNid));
  write(NetworkedMaterial.emissive, eid, APP.getSid(emissive));
  write(NetworkedMaterial.emissiveMapNid, eid, APP.getSid(emissiveMapNid));
  write(NetworkedMaterial.emissiveIntensity, eid, emissiveIntensity);
  write(NetworkedMaterial.roughnessMapNid, eid, APP.getSid(roughnessMapNid));
  write(NetworkedMaterial.roughness, eid, roughness);
  write(NetworkedMaterial.metalnessMapNid, eid, APP.getSid(metalnessMapNid));
  write(NetworkedMaterial.metalness, eid, metalness);
  write(NetworkedMaterial.lightMapNid, eid, APP.getSid(lightMapNid));
  write(NetworkedMaterial.lightMapIntensity, eid, lightMapIntensity);
  write(NetworkedMaterial.aoMapNid, eid, APP.getSid(aoMapNid));
  write(NetworkedMaterial.aoMapIntensity, eid, aoMapIntensity);
  write(NetworkedMaterial.normalMapNid, eid, APP.getSid(normalMapNid));
  write(NetworkedMaterial.alphaTest, eid, alphaTest);
  write(NetworkedMaterial.flags, eid, flags);
  return true;
}

const runtimeSerde = defineNetworkSchema(NetworkedMaterial);
export const NetworkedMaterialSchema: NetworkSchema = {
  componentName: "networked-material",
  serialize: runtimeSerde.serialize,
  deserialize: runtimeSerde.deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: {
        color: APP.getString(read(NetworkedMaterial.color, eid)),
        mapNid: APP.getString(read(NetworkedMaterial.mapNid, eid)),
        opacity: read(NetworkedMaterial.opacity, eid),
        alphaMapNid: APP.getString(read(NetworkedMaterial.alphaMapNid, eid)),
        emissive: APP.getString(read(NetworkedMaterial.emissive, eid)),
        emissiveMapNid: APP.getString(read(NetworkedMaterial.emissiveMapNid, eid)),
        emissiveIntensity: read(NetworkedMaterial.emissiveIntensity, eid),
        roughnessMapNid: APP.getString(read(NetworkedMaterial.roughnessMapNid, eid)),
        roughness: read(NetworkedMaterial.roughness, eid),
        metalnessMapNid: APP.getString(read(NetworkedMaterial.metalnessMapNid, eid)),
        metalness: read(NetworkedMaterial.metalness, eid),
        lightMapNid: APP.getString(read(NetworkedMaterial.lightMapNid, eid)),
        lightMapIntensity: read(NetworkedMaterial.lightMapIntensity, eid),
        aoMapNid: APP.getString(read(NetworkedMaterial.aoMapNid, eid)),
        aoMapIntensity: read(NetworkedMaterial.aoMapIntensity, eid),
        normalMapNid: APP.getString(read(NetworkedMaterial.normalMapNid, eid)),
        alphaTest: read(NetworkedMaterial.alphaTest, eid),
        flags: read(NetworkedMaterial.flags, eid)
      }
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};
