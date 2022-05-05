import { THREE } from "aframe";
import { Reflector } from "three/examples/jsm/objects/Reflector";
import { addObject3DComponent } from "./utils/jsx-entity";

const DEFAULT_PROPS = {
  geometry: new THREE.PlaneBufferGeometry(),
  color: new THREE.Color(1, 1, 1),
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio
};

import { Layers } from "./components/layers";

export function inflateMirror(world, eid, componentProps) {
  componentProps = Object.assign({}, DEFAULT_PROPS, componentProps);
  const reflector = new Reflector(componentProps.geometry, {
    color: componentProps.color,
    textureWidth: componentProps.textureWidth,
    textureHeight: componentProps.textureHeight
  });
  addObject3DComponent(world, eid, reflector);

  const originalOnBeforeRender = reflector.onBeforeRender;
  reflector.onBeforeRender = function(renderer, scene, camera) {
    const originalRender = renderer.render;
    renderer.render = function(scene, camera) {
      camera.layers.enable(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);
      camera.layers.enable(Layers.CAMERA_LAYER_VIDEO_TEXTURE_TARGET);
      reflector.onBeforeRender = originalOnBeforeRender;
      originalRender.call(renderer, scene, camera);
    };
    originalOnBeforeRender(renderer, scene, camera);
    renderer.render = originalRender;
  };
}
