import "three/examples/js/loaders/GLTFLoader";
import loadingObjectSrc from "../assets/LoadingObject_Atom.glb";

const gltfLoader = new THREE.GLTFLoader();
let loadingObject;
gltfLoader.load(loadingObjectSrc, gltf => {
  loadingObject = gltf;
});

AFRAME.registerComponent("loading-indicator", {
  init() {
    const useFancyLoader = !!loadingObject;
    const mesh = useFancyLoader
      ? loadingObject.scene.clone()
      : new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    if (useFancyLoader) {
      this.loaderMixer = new THREE.AnimationMixer(mesh);
      this.loadingClip = this.loaderMixer.clipAction(loadingObject.animations[0]);
      this.loadingClip.play();
    }
    this.el.setObject3D("loader", mesh);
  },

  tick(t, dt) {
    if (this.loaderMixer) {
      this.loaderMixer.update(dt / 1000);
    }
  },

  remove() {
    this.el.removeObject3D("loader");
  }
});
