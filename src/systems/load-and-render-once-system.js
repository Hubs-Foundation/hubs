function load(src, scene) {
  return new Promise(resolve => {
    const entity = document.createElement("a-entity");
    entity.setAttribute("media-loader", {
      src,
      resolve: false,
      resize: false,
      animate: false,
      fileIsOwned: false
    });

    entity.addEventListener("model-loaded", () => {
      resolve(entity);
    });
    scene.appendChild(entity);
  });
}

function load2(src, scene) {
    return new Promise(resolve => {
        const entity = document.createElement("a-entity");
        entity.setAttribute("gltf-model-plus", {
            src,
            useCache: true,
            inflate: true,
        });

        entity.addEventListener("model-loaded", () => {
            resolve(entity);
        });
        scene.appendChild(entity);
    });
}

import cameraModelSrc from "../assets/camera_tool.glb";
const cameraModelPromise = new Promise(resolve => new THREE.GLTFLoader().load(cameraModelSrc, resolve));

export class LoadAndRenderOnceSystem {
  constructor(scene) {
    this.loaded = [];
    this.rendered = [];
    this.onLoaded = entity => {
      entity.object3D.frustumCulled = false;
      entity.object3D.visible = true;
      this.loaded.push(entity);
    };
    load("https://asset-bundles-prod.reticulum.io/interactables/DrawingPen/DrawingPen-34fb4aee27.gltf", scene).then(
      this.onLoaded
    );
    load2(cameraModelSrc, scene).then(
      this.onLoaded
    );
  }

  tick() {
    while (this.rendered.length) {
      const rendered = this.rendered.pop();
      rendered.parentNode.removeChild(rendered);
    }

    for (let i = 0; i < this.loaded.length; i++) {
      this.rendered.push(this.loaded[i]);
    }
    this.loaded.length = 0;
  }
}
