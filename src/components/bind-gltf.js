// AFRAME.registerComponent("bind-gltf", {
//   init() {
//     this.onLoad = this.onLoad.bind(this);
//     this.el.addEventListener("model-loaded", this.onLoad);
//   },
//   onLoad(e) {
//     if (e.target !== this.el) {
//       return;
//     }

//     console.log("Loaded model");
//     const sceneEl = this.el.sceneEl;
//     const threeRootNode = this.el.object3D;
//     const bindingEls = this.el.querySelectorAll("[gltf-binding]");

//     for (const el of bindingEls) {
//       const threeNodeName = el.components["gltf-binding"].data;
//       const threeNode = threeRootNode.getObjectByName(threeNodeName);
//       sceneEl.object3D.remove(el.object3D);
//       el.object3D = threeNode;
//     }
//   }
// });

AFRAME.registerComponent("model-binding", {
  schema: { type: "string" },
  init() {
    this.el.parentEl.addEventListener("object3dset", () => {
      const modelObj = this.el.parentEl.getObject3D("mesh");
      this.el.object3D = modelObj.getObjectByName(this.data);
      this.el.object3D.el = this.el;
    });
  }
});
