declare module "lib-hubs/packages/three-particle-emitter/lib/esm/index" {
  import { ParticleEmitter as PE } from "lib-hubs/packages/three-particle-emitter/lib/types";

  export class ParticleEmitter extends PE {
    material: ShaderMaterial;
    constructor(texture: Texture);
  }
}
