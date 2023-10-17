import { addComponent, defineQuery, enterQuery, hasComponent } from "bitecs";
import { Texture } from "three";
import { GLTFMaterial } from "../entity-nodes";
import { MaterialFlags } from "../../../inflators/networked-material";
import { EntityID, MaterialTag, Networked, NetworkedMaterial, Owned } from "../../../bit-components";
import { HubsWorld } from "../../../app";

export function material2NetworkedMaterial(eid: EntityID, mat: GLTFMaterial) {
  NetworkedMaterial.color[eid] = mat.color.getHex();
  NetworkedMaterial.mapNid[eid] = mat.map ? Networked.id[mat.map.eid!] : 0;
  if (mat.transparent) {
    NetworkedMaterial.flags[eid] |= MaterialFlags.TRANSPARENT;
  } else {
    NetworkedMaterial.flags[eid] &= ~MaterialFlags.TRANSPARENT;
  }
  NetworkedMaterial.opacity[eid] = mat.opacity;
  NetworkedMaterial.alphaMapNid[eid] = mat.alphaMap ? Networked.id[mat.alphaMap.eid!] : 0;
  if (mat.toneMapped) {
    NetworkedMaterial.flags[eid] |= MaterialFlags.TONE_MAPPED;
  } else {
    NetworkedMaterial.flags[eid] &= ~MaterialFlags.TONE_MAPPED;
  }
  NetworkedMaterial.emissive[eid] = mat.emissive.getHex();
  NetworkedMaterial.emissiveMapNid[eid] = mat.emissiveMap ? Networked.id[mat.emissiveMap.eid!] : 0;
  NetworkedMaterial.emissiveIntensity[eid] = mat.emissiveIntensity;
  NetworkedMaterial.roughnessMapNid[eid] = mat.roughnessMap ? Networked.id[mat.roughnessMap.eid!] : 0;
  NetworkedMaterial.roughness[eid] = mat.roughness;
  NetworkedMaterial.metalnessMapNid[eid] = mat.metalnessMap ? Networked.id[mat.metalnessMap.eid!] : 0;
  NetworkedMaterial.metalness[eid] = mat.metalness;
  NetworkedMaterial.lightMapNid[eid] = mat.lightMap ? Networked.id[mat.lightMap.eid!] : 0;
  NetworkedMaterial.lightMapIntensity[eid] = mat.lightMapIntensity;
  NetworkedMaterial.aoMapNid[eid] = mat.aoMap ? Networked.id[mat.aoMap.eid!] : 0;
  NetworkedMaterial.aoMapIntensity[eid] = mat.aoMapIntensity;
  NetworkedMaterial.normalMapNid[eid] = mat.normalMap ? Networked.id[mat.normalMap.eid!] : 0;
  if (mat.wireframe) {
    NetworkedMaterial.flags[eid] |= MaterialFlags.WIREFRAME;
  } else {
    NetworkedMaterial.flags[eid] &= ~MaterialFlags.WIREFRAME;
  }
  if (mat.flatShading) {
    NetworkedMaterial.flags[eid] |= MaterialFlags.FLAT_SHADED;
  } else {
    NetworkedMaterial.flags[eid] &= ~MaterialFlags.FLAT_SHADED;
  }
  if (mat.fog) {
    NetworkedMaterial.flags[eid] |= MaterialFlags.FOG;
  } else {
    NetworkedMaterial.flags[eid] &= ~MaterialFlags.FOG;
  }
  if (mat.depthWrite) {
    NetworkedMaterial.flags[eid] |= MaterialFlags.DEPTH_WRITE;
  } else {
    NetworkedMaterial.flags[eid] &= ~MaterialFlags.DEPTH_WRITE;
  }
  NetworkedMaterial.alphaTest[eid] = mat.alphaTest;
}

// TODO Support multiple materials por object
const networkedMaterialQuery = defineQuery([MaterialTag, Networked, NetworkedMaterial]);
const networkedMaterialEnterQuery = enterQuery(networkedMaterialQuery);
export function materialSystem(world: HubsWorld) {
  networkedMaterialEnterQuery(world).forEach(eid => {
    let material = world.eid2mat.get(eid)! as GLTFMaterial;
    if (material) {
      material2NetworkedMaterial(eid, material);
    }

    // We want to have a shared nid for textures so we can assign across clients so we add the networked component
    // to have that shared id although we are not networking Texture properties.
    const mat = world.eid2mat.get(eid)!;
    for (const [_, value] of Object.entries(mat)) {
      if (value && value instanceof Texture) {
        if (!hasComponent(world, Networked, value.eid!)) {
          addComponent(world, Networked, value.eid!);
        }
      }
    }
  });
  networkedMaterialQuery(world).forEach(eid => {
    let material = world.eid2mat.get(eid)! as GLTFMaterial;
    if (material) {
      if (!hasComponent(world, Owned, eid)) {
        if (material.color.getHex() !== NetworkedMaterial.color[eid]) {
          material.color.setHex(NetworkedMaterial.color[eid]);
        }
        const newMapNid = NetworkedMaterial.mapNid[eid];
        const newMapEid = world.nid2eid.get(newMapNid)!;
        if (material.map?.eid !== newMapEid) {
          material.map = world.eid2tex.get(newMapEid)!;
          material.needsUpdate = true;
        }
        const isTransparent = NetworkedMaterial.flags[eid] & MaterialFlags.TRANSPARENT ? true : false;
        if (material.transparent !== isTransparent) {
          material.transparent = isTransparent;
        }
        if (material.opacity !== NetworkedMaterial.opacity[eid]) {
          material.opacity = NetworkedMaterial.opacity[eid];
        }
        const newAlphaMapNid = NetworkedMaterial.alphaMapNid[eid];
        const newAlphaMapEid = world.nid2eid.get(newAlphaMapNid)!;
        if (material.alphaMap?.eid !== newAlphaMapEid) {
          material.alphaMap = world.eid2tex.get(newAlphaMapEid)!;
          material.needsUpdate = true;
        }
        if (material.emissive.getHex() !== NetworkedMaterial.emissive[eid]) {
          material.emissive.setHex(NetworkedMaterial.emissive[eid]);
        }
        const newEmissiveMapNid = NetworkedMaterial.emissiveMapNid[eid];
        const newEmissiveMapEid = world.nid2eid.get(newEmissiveMapNid)!;
        if (material.emissiveMap?.eid !== newEmissiveMapEid) {
          material.emissiveMap = world.eid2tex.get(newEmissiveMapEid)!;
          material.needsUpdate = true;
        }
        if (material.emissiveIntensity !== NetworkedMaterial.emissiveIntensity[eid]) {
          material.emissiveIntensity = NetworkedMaterial.emissiveIntensity[eid];
        }
        const newRoughnessMapNid = NetworkedMaterial.roughnessMapNid[eid];
        const newRoughnessMapEid = world.nid2eid.get(newRoughnessMapNid)!;
        if (material.roughnessMap?.eid !== newRoughnessMapEid) {
          material.roughnessMap = world.eid2tex.get(newRoughnessMapEid)!;
          material.needsUpdate = true;
        }
        if (material.roughness !== NetworkedMaterial.roughness[eid]) {
          material.roughness = NetworkedMaterial.roughness[eid];
        }
        const newMetalnessMapNid = NetworkedMaterial.metalnessMapNid[eid];
        const newMetalnessMapEid = world.nid2eid.get(newMetalnessMapNid)!;
        if (material.metalnessMap?.eid !== newMetalnessMapEid) {
          material.metalnessMap = world.eid2tex.get(newMetalnessMapEid)!;
          material.needsUpdate = true;
        }
        if (material.metalness !== NetworkedMaterial.metalness[eid]) {
          material.metalness = NetworkedMaterial.metalness[eid];
        }
        const newLightMapNid = NetworkedMaterial.lightMapNid[eid];
        const newLightMapEid = world.nid2eid.get(newLightMapNid)!;
        if (material.lightMap?.eid !== newLightMapEid) {
          material.lightMap = world.eid2tex.get(newLightMapEid)!;
          material.needsUpdate = true;
        }
        if (material.lightMapIntensity !== NetworkedMaterial.lightMapIntensity[eid]) {
          material.lightMapIntensity = NetworkedMaterial.lightMapIntensity[eid];
        }
        const newAoMapNid = NetworkedMaterial.aoMapNid[eid];
        const newAoMapEid = world.nid2eid.get(newAoMapNid)!;
        if (material.aoMap?.eid !== newAoMapEid) {
          material.aoMap = world.eid2tex.get(newAoMapEid)!;
          material.needsUpdate = true;
        }
        if (material.aoMapIntensity !== NetworkedMaterial.aoMapIntensity[eid]) {
          material.aoMapIntensity = NetworkedMaterial.aoMapIntensity[eid];
        }
        const newNormalMapNid = NetworkedMaterial.normalMapNid[eid];
        const newNormalMapEid = world.nid2eid.get(newNormalMapNid)!;
        if (material.normalMap?.eid !== newNormalMapEid) {
          material.normalMap = world.eid2tex.get(newNormalMapEid)!;
          material.needsUpdate = true;
        }
        const isWireframe = NetworkedMaterial.flags[eid] & MaterialFlags.WIREFRAME ? true : false;
        if (material.wireframe !== isWireframe) {
          material.wireframe = isWireframe;
        }
        const isFlatShading = NetworkedMaterial.flags[eid] & MaterialFlags.FLAT_SHADED ? true : false;
        if (material.flatShading !== isFlatShading) {
          material.flatShading = isFlatShading;
        }
        const isFog = NetworkedMaterial.flags[eid] & MaterialFlags.FOG ? true : false;
        if (material.fog !== isFog) {
          material.fog = isFog;
        }
        const isDepthWrite = NetworkedMaterial.flags[eid] & MaterialFlags.FOG ? true : false;
        if (material.depthWrite !== isDepthWrite) {
          material.depthWrite = isDepthWrite;
        }
        if (material.alphaTest !== NetworkedMaterial.alphaTest[eid]) {
          material.alphaTest = NetworkedMaterial.alphaTest[eid];
        }
      }
    }
  });
}
