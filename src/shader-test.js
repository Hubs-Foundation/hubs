import "aframe";

import "three/examples/js/loaders/GLTFLoader";

import "./components/scene-components";
import "aframe-physics-system";
import "aframe-physics-extras";
import "super-hands";
import "./components/auto-scale-cannon-physics-body";
import "./components/interactables/hoverable-visuals";
import "./gltf-component-mappings";

AFRAME.registerComponent("warn-missing", {
  init() {
    for (const el of this.el.querySelectorAll("*")) {
      for (const attr of el.getAttributeNames()) {
        if (!AFRAME.components[attr]) {
          console.log(`${attr} missing`);
        }
      }
    }
  }
});

AFRAME.registerComponent("mouse-move", {
  play() {
    const initialPosition = this.el.object3D.position.clone();
    window.addEventListener("contextmenu", e => {
      e.preventDefault();
    });
    document.body.addEventListener("wheel", e => {
      if (e.buttons === 2) {
        this.el.object3D.position.z += (e.deltaY > 0 ? 1 : -1) * 0.05;
      }
    });
    document.body.addEventListener("mousemove", e => {
      if (e.buttons === 2) {
        const d = 3;
        this.el.object3D.position.x = initialPosition.x + (e.clientX / window.innerWidth) * d - d / 2;
        this.el.object3D.position.y = initialPosition.y + d - (e.clientY / window.innerHeight) * d - d / 2;
      }
    });
  }
});

const onReady = async () => {};

document.addEventListener("DOMContentLoaded", onReady);
