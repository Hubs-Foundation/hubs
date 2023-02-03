import { addComponent } from "bitecs";
import { PlaneGeometry } from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector";
import { addObject3DComponent } from "../utils/jsx-entity";
import { Mirror } from "../bit-components";
import { HubsWorld } from "../app";
import { Layers } from "../camera-layers";

const DEFAULT_MIRROR_GEOMETRY = new PlaneGeometry();
// We may need to revisit the default texture size
// because the full window resolution may be too huge.
const DEFAULT_TEXTURE_WIDTH = window.innerWidth * window.devicePixelRatio;
const DEFAULT_TEXTURE_HEIGHT = window.innerHeight * window.devicePixelRatio;

export type MirrorParams = {
  color?: string;
};

const DEFAULTS = {
  color: '#7f7f7f'
};

export function inflateMirror(world: HubsWorld, eid: number, params: MirrorParams) {
  params = Object.assign({}, DEFAULTS, params);
  const geometry = DEFAULT_MIRROR_GEOMETRY;
  const reflector = new Reflector(geometry, {
    color: params.color,
    textureWidth: DEFAULT_TEXTURE_WIDTH,
    textureHeight: DEFAULT_TEXTURE_HEIGHT
  });

  // HACK the first time we render this, add the appropriate camera layers
  // to the virtual camera. There is no other way to easily access camera
  // used for Reflector. We may remove with Three.js r149 or newer because
  // Reflector will expose camera.
  const originalOnBeforeRender = reflector.onBeforeRender;
  reflector.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
    const originalRender = renderer.render;
    renderer.render = function (scene, camera) {
      camera.layers.enable(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);
      camera.layers.enable(Layers.CAMERA_LAYER_VIDEO_TEXTURE_TARGET);
      reflector.onBeforeRender = originalOnBeforeRender;
      originalRender.call(renderer, scene, camera);
    };
    originalOnBeforeRender(renderer, scene, camera, geometry, material, group);
    renderer.render = originalRender;
  };

  addObject3DComponent(world, eid, reflector);
  addComponent(world, Mirror, eid);
  return eid;
}

