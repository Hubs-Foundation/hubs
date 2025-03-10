import { defineQuery, enterQuery, exitQuery, removeComponent } from "bitecs";
import { ParticleEmitter } from "lib-hubs/packages/three-particle-emitter/lib/esm/index";
import { Texture } from "three";

import { HubsWorld } from "../app";
import { ParticleEmitterTag } from "../bit-components";
import { JobRunner } from "../utils/coroutine-utils";
import { proxiedUrlFor } from "../utils/media-url-utils";
import { resolveUrl, textureLoader } from "../utils/media-utils";

function* setTexture(world: HubsWorld, eid: number) {
  let src = APP.sid2str.get(ParticleEmitterTag.src[eid]);

  try {
    const result: URL = yield resolveUrl(src);
    let canonicalUrl = result.origin;

    // handle protocol relative urls
    if (canonicalUrl.startsWith("//")) {
      canonicalUrl = location.protocol + canonicalUrl;
    }

    // todo: we don't need to proxy for many things if the canonical URL has permissive CORS headers
    src = proxiedUrlFor(canonicalUrl);

    const texture: Texture = yield textureLoader.loadAsync(src);

    const particleEmitter: ParticleEmitter = world.eid2obj.get(eid)! as ParticleEmitter;
    particleEmitter.material.uniforms.map.value = texture;
    particleEmitter.visible = true;

    particleEmitter.updateParticles();
  } catch (e) {
    console.error(`Error loading particle image: ${src}`);
    removeComponent(world, ParticleEmitterTag, eid);
  }
}

const particleEmitterQuery = defineQuery([ParticleEmitterTag]);
const particleEmitterEnterQuery = enterQuery(particleEmitterQuery);
const particleEmitterExitQuery = exitQuery(particleEmitterQuery);

const jobs = new JobRunner();
export function particleEmitterSystem(world: HubsWorld) {
  particleEmitterEnterQuery(world).forEach(eid => {
    jobs.add(eid, () => setTexture(world, eid));
  });
  particleEmitterExitQuery(world).forEach(function (eid) {
    // Object3D resources release happens in remove-object3D-system
    jobs.stop(eid);
  });
  particleEmitterQuery(world).forEach(eid => {
    jobs.tick();

    const particleEmitter: ParticleEmitter = world.eid2obj.get(eid)! as ParticleEmitter;
    if (particleEmitter.visible) {
      particleEmitter.update(world.time.delta / 1000);
    }
  });
}
