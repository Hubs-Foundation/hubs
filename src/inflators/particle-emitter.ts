import { addComponent } from "bitecs";
import { addObject3DComponent } from "../utils/jsx-entity";
import { ParticleEmitterTag } from "../bit-components";
import { HubsWorld } from "../app";
import defaultSrcImage from "../assets/images/warning_icon.png";
import { ParticleEmitter } from "lib-hubs/packages/three-particle-emitter/lib/esm/index";

const defaultSrcUrl = new URL(defaultSrcImage, window.location.href).href;

export type ParticleEmitterParams = {
  src: string;
  startColor: string;
  middleColor: string;
  endColor: string;
  startOpacity: number;
  middleOpacity: number;
  endOpacity: number;
  colorCurve: string;
  sizeCurve: string;
  startSize: number;
  endSize: number;
  sizeRandomness: number;
  ageRandomness: number;
  lifetime: number;
  lifetimeRandomness: number;
  particleCount: number;
  startVelocity: {
    x: number;
    y: number;
    z: number;
  };
  endVelocity: {
    x: number;
    y: number;
    z: number;
  };
  velocityCurve: string;
  angularVelocity: number;
};

const DEFAULTS = {
  src: defaultSrcImage,
  startColor: "#ffffff",
  middleColor: "#ffffff",
  endColor: "#ffffff",
  startOpacity: 1,
  middleOpacity: 1,
  endOpacity: 1,
  colorCurve: "linear",
  sizeCurve: "linear",
  startSize: 0.25,
  endSize: 0.25,
  sizeRandomness: 0,
  ageRandomness: 10,
  lifetime: 5,
  lifetimeRandomness: 5,
  particleCount: 100,
  startVelocity: { x: 0, y: 0, z: 0.5 },
  endVelocity: { x: 0, y: 0, z: 0 },
  velocityCurve: "linear",
  angularVelocity: 0
};

export function inflateParticleEmitter(world: HubsWorld, eid: number, params: ParticleEmitterParams) {
  params = Object.assign({}, DEFAULTS, params);

  const particleEmitter = new ParticleEmitter(null);
  particleEmitter.visible = false;

  addObject3DComponent(world, eid, particleEmitter);
  addComponent(world, ParticleEmitterTag, eid);

  ParticleEmitterTag.src[eid] = APP.getSid(params.src || defaultSrcUrl);

  particleEmitter.startColor.set(params.startColor);
  particleEmitter.middleColor.set(params.middleColor);
  particleEmitter.endColor.set(params.endColor);
  particleEmitter.startOpacity = params.startOpacity;
  particleEmitter.middleOpacity = params.middleOpacity;
  particleEmitter.endOpacity = params.endOpacity;
  particleEmitter.colorCurve = params.colorCurve;
  particleEmitter.sizeCurve = params.sizeCurve;
  particleEmitter.startSize = params.startSize;
  particleEmitter.endSize = params.endSize;
  particleEmitter.sizeRandomness = params.sizeRandomness;
  particleEmitter.ageRandomness = params.ageRandomness;
  particleEmitter.lifetime = params.lifetime;
  particleEmitter.lifetimeRandomness = params.lifetimeRandomness;
  particleEmitter.particleCount = params.particleCount;
  particleEmitter.startVelocity.set(params.startVelocity.x, params.startVelocity.y, params.startVelocity.z);
  particleEmitter.endVelocity.set(params.endVelocity.x, params.endVelocity.y, params.endVelocity.z);
  particleEmitter.velocityCurve = params.velocityCurve;
  particleEmitter.angularVelocity = params.angularVelocity;

  return eid;
}
