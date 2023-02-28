import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { Group, SkinnedMesh } from "three";
import { HubsWorld } from "../app";
import { MorphAudioFeedback, NetworkAudioAnalyser, NetworkedAvatar } from "../bit-components";
import { findAncestorWithComponent, findChildWithComponent } from "../utils/bit-utils";
import { easeOutQuadratic } from "../utils/easing";

const eid2analyserEid = new Map<number, number>();
const eid2morphs = new Map<number, MeshMorphs[]>();

interface MeshMorphs {
  mesh: SkinnedMesh;
  morphNumber: number;
}

const morphAudioFeedbackQuery = defineQuery([MorphAudioFeedback]);
const morphAudioFeedbackEnterQuery = enterQuery(morphAudioFeedbackQuery);
const morphAudioFeedbackExitQuery = exitQuery(morphAudioFeedbackQuery);
export function morphAudioFeedbackSystem(world: HubsWorld) {
  morphAudioFeedbackEnterQuery(world).forEach(eid => {
    const networkedAvatarEid = findAncestorWithComponent(world, NetworkedAvatar, eid)!;
    const networkedAudioAnalyserEid = findChildWithComponent(world, NetworkAudioAnalyser, networkedAvatarEid)!;
    eid2analyserEid.set(eid, networkedAudioAnalyserEid);

    const obj = world.eid2obj.get(eid)!;
    const meshes = [];
    if (obj instanceof SkinnedMesh) {
      meshes.push(obj);
    } else if (obj instanceof Group) {
      obj.traverse(child => {
        if (child instanceof SkinnedMesh) {
          meshes.push(child);
        }
      });
    }

    const morphName = APP.getString(MorphAudioFeedback.name[eid])!;
    if (meshes.length > 0) {
      const morphs: Array<MeshMorphs> = meshes
        .filter(mesh => mesh.morphTargetDictionary !== undefined && mesh.morphTargetInfluences !== undefined)
        .map((mesh: SkinnedMesh) => ({ mesh, morphNumber: mesh.morphTargetDictionary![morphName] }));
      eid2morphs.set(eid, morphs);
    }
  });
  morphAudioFeedbackExitQuery(world).forEach(eid => {
    eid2morphs.delete(eid);
    eid2analyserEid.delete(eid);
  });
  morphAudioFeedbackQuery(world).forEach(eid => {
    if (eid2analyserEid.has(eid)) {
      const networkedAudioAnalyserEid = eid2analyserEid.get(eid)!;
      const morphValue = THREE.MathUtils.mapLinear(
        easeOutQuadratic(NetworkAudioAnalyser.volume[networkedAudioAnalyserEid] || 0),
        0,
        1,
        MorphAudioFeedback.minValue[eid],
        MorphAudioFeedback.maxValue[eid]
      );
      const morphs = eid2morphs.get(eid)!;
      morphs.forEach(morph => {
        morph.mesh.morphTargetInfluences![morph.morphNumber] = morphValue;
      });
    }
  });
}
