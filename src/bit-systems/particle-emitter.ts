import { defineQuery, enterQuery } from "bitecs";
import { ParticleEmitter } from "lib-hubs/packages/three-particle-emitter/lib/esm/index";

import { HubsWorld } from "../app";
import { ParticleEmitterTag } from "../bit-components";
import { proxiedUrlFor } from "../utils/media-url-utils";
import { resolveUrl, textureLoader } from "../utils/media-utils";

const particleEmitterQuery = defineQuery([ParticleEmitterTag]);
const particleEmitterEnterQuery = enterQuery(particleEmitterQuery);

const setTexture = async (world: HubsWorld, eid: number) => {
  let src = APP.sid2str.get(ParticleEmitterTag.src[eid]);

  const result = await resolveUrl(src);
  let canonicalUrl = result.origin;

  // handle protocol relative urls
  if (canonicalUrl.startsWith("//")) {
    canonicalUrl = location.protocol + canonicalUrl;
  }

  // todo: we don't need to proxy for many things if the canonical URL has permissive CORS headers
  src = proxiedUrlFor(canonicalUrl);

  const texture = await textureLoader.loadAsync(src);

  const particleEmitter: ParticleEmitter = world.eid2obj.get(eid)! as ParticleEmitter;
  particleEmitter.material.uniforms.map.value = texture;
  particleEmitter.visible = true;

  ParticleEmitterTag.updateParticles[eid] = 1;
};

export function particleEmitterSystem(world: HubsWorld) {
  particleEmitterEnterQuery(world).forEach(eid => {
    setTexture(world, eid);
  });
  particleEmitterQuery(world).forEach(eid => {
    const particleEmitter: ParticleEmitter = world.eid2obj.get(eid)! as ParticleEmitter;

    if (ParticleEmitterTag.updateParticles[eid]) {
      particleEmitter.updateParticles();
      ParticleEmitterTag.updateParticles[eid] = 0;
    }

    if (particleEmitter.visible) {
      particleEmitter.update(world.time.delta / 1000);
    }
  });
  // The resources release happens in remove-object3D-system
}
