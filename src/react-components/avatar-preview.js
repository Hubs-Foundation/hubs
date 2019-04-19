import React, { Component } from "react";
import PropTypes from "prop-types";
import "three/examples/js/controls/OrbitControls";

import { createDefaultEnvironmentMap } from "../components/environment-map";
import { loadGLTF } from "../components/gltf-model-plus";
import { disposeNode } from "../utils/three-utils";

const TEXTURE_PROPS = {
  base_map: ["map"],
  emissive_map: ["emissiveMap"],
  normal_map: ["normalMap"],
  orm_map: ["aoMap", "roughnessMap", "metalnessMap"]
};

// This should match our aframe renderer="antialias: true; colorManagement: true; sortObjects: true; physicallyCorrectLights: true; alpha: false; webgl2: true; multiview: false;"
function createRenderer(canvas) {
  const context = canvas.getContext("webgl2", {
    alpha: false,
    depth: true,
    antialias: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: "default"
  });

  const renderer = new THREE.WebGLRenderer({ canvas, context });
  renderer.gammaOutput = true;
  renderer.gammaFactor = 2.2;
  renderer.physicallyCorrectLights = true;
  return renderer;
}

const imgLoader = new THREE.ImageBitmapLoader();
const loadImageBitmap = url => new Promise((resolve, reject) => imgLoader.load(url, resolve, null, reject));

export default class AvatarPreview extends Component {
  static propTypes = {
    avatar: PropTypes.object
  };

  componentDidMount = () => {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xeaeaea);

    this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
    const controls = new THREE.OrbitControls(this.camera, this.canvas);

    const light = new THREE.DirectionalLight(0xfdf5c2, 3);
    light.position.set(0, 10, 10);
    this.scene.add(light);
    this.scene.add(new THREE.HemisphereLight(0xb1e3ff, 0xb1e3ff, 3));

    this.camera.position.set(-0.2, 0.5, 0.5);
    this.camera.matrixAutoUpdate = true;

    controls.target.set(0, 0.45, 0);
    controls.update();

    const clock = new THREE.Clock();
    this.previewRenderer = createRenderer(this.canvas);
    this.previewRenderer.setAnimationLoop(() => {
      const dt = clock.getDelta();
      this.mixer && this.mixer.update(dt);
      this.previewRenderer.render(this.scene, this.camera);
    });
    window.addEventListener("resize", this.resize);
    this.resize();
  };

  componentDidUpdate = () => {
    if (this.avatar) {
      this.scene.remove(this.avatar);
      this.avatar = null;
    }
    if (!this.props.avatar) return;
    this.loadPreviewAvatar(this.props.avatar).then(avatar => {
      this.avatar = avatar;
      this.scene.add(avatar);
    });
  };

  resize = () => {
    const width = this.canvas.parentElement.offsetWidth;
    const height = this.canvas.parentElement.offsetHeight;
    this.previewRenderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  componentWillUnmount = () => {
    this.scene && this.scene.traverse(disposeNode);
    this.previewRenderer && this.previewRenderer.dispose();
    window.removeEventListener("resize", this.resize);
  };

  loadPreviewAvatar = async avatar => {
    if (!avatar) return;
    const gltf = await loadGLTF(avatar.base_gltf_url, "model/gltf");

    // On the bckend we look for a material called Bot_PBS, here we are looking for a mesh called Avatar.
    // When we "officially" support uploading custom GLTFs we need to decide what we are going to key things on
    this.previewMesh = gltf.scene.getObjectByName("Avatar") || gltf.scene.getObjectByName("Bot_Skinned");

    const idleAnimation = gltf.animations && gltf.animations.find(({ name }) => name === "idle_eyes");
    if (idleAnimation) {
      this.mixer = new THREE.AnimationMixer(this.previewMesh);
      const action = this.mixer.clipAction(idleAnimation);
      action.enabled = true;
      action.setLoop(THREE.LoopRepeat, Infinity).play();
    }

    const material = this.previewMesh.material;
    // We delete onUpdate here to opt out of the auto texture cleanup after GPU upload.
    const getImage = p => delete material[p].onUpdate && material[p].image;
    this.originalMaps = {
      base_map: TEXTURE_PROPS["base_map"].map(getImage),
      emissive_map: TEXTURE_PROPS["emissive_map"].map(getImage),
      normal_map: TEXTURE_PROPS["normal_map"].map(getImage),
      orm_map: TEXTURE_PROPS["orm_map"].map(getImage)
    };

    const imgFiles = avatar.files;
    if (imgFiles) {
      await Promise.all([
        Promise.all(
          Object.keys(this.originalMaps).map(
            m => imgFiles[m] && loadImageBitmap(imgFiles[m]).then(this.applyMapToPreview.bind(this, m))
          )
        ),
        createDefaultEnvironmentMap().then(t => {
          this.previewMesh.material.envMap = t;
          this.previewMesh.material.needsUpdate = true;
        })
      ]);
    }

    return gltf.scene;
  };

  applyMapToPreview = (name, image) => {
    TEXTURE_PROPS[name].forEach(prop => {
      const texture = this.previewMesh.material[prop];
      texture.image = image;
      texture.needsUpdate = true;
    });
  };

  revertMap = name => {
    this.originalMaps[name].forEach((bm, i) => {
      const texture = this.previewMesh.material[TEXTURE_PROPS[name][i]];
      texture.image = bm;
      texture.needsUpdate = true;
    });
  };

  render() {
    return (
      <div className="preview">
        <canvas ref={c => (this.canvas = c)} />
      </div>
    );
  }
}
