import { addMedia } from "../utils/media-utils";
import { ObjectTypes } from "../object-types";

const snapCanvas = document.createElement("canvas");
async function pixelsToPNG(pixels, width, height) {
  snapCanvas.width = width;
  snapCanvas.height = height;
  const context = snapCanvas.getContext("2d");

  const imageData = context.createImageData(width, height);
  imageData.data.set(pixels);
  const bitmap = await createImageBitmap(imageData);
  context.scale(1, -1);
  context.drawImage(bitmap, 0, -height);
  const blob = await new Promise(resolve => snapCanvas.toBlob(resolve));
  return new File([blob], "snap.png", { type: "image/png" });
}

AFRAME.registerComponent("camera-tool", {
  schema: {
    previewFPS: { default: 6 },
    imageWidth: { default: 512 },
    imageHeight: { default: 512 }
  },

  init() {
    this.stateAdded = this.stateAdded.bind(this);

    this.lastUpdate = performance.now();

    this.renderTarget = new THREE.WebGLRenderTarget(this.data.imageWidth, this.data.imageHeight, {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      encoding: THREE.sRGBEncoding,
      depth: false,
      stencil: false
    });

    this.camera = new THREE.PerspectiveCamera();
    this.camera.rotation.set(0, Math.PI, 0);
    this.el.setObject3D("camera", this.camera);

    const material = new THREE.MeshBasicMaterial({
      map: this.renderTarget.texture
    });
    // Bit of a hack here to only update the renderTarget when the screens are in view and at a reduced FPS
    material.map.isVideoTexture = true;
    material.map.update = () => {
      if (performance.now() - this.lastUpdate >= 1000 / this.data.previewFPS) {
        this.updateRenderTargetNextTick = true;
      }
    };

    this.el.addEventListener(
      "model-loaded",
      () => {
        const geometry = new THREE.PlaneGeometry(0.25, 0.25);

        const screen = new THREE.Mesh(geometry, material);
        screen.rotation.set(0, Math.PI, 0);
        screen.position.set(0, -0.015, -0.08);
        this.el.setObject3D("screen", screen);

        const selfieScreen = new THREE.Mesh(geometry, material);
        selfieScreen.position.set(0, 0.3, 0);
        selfieScreen.scale.set(-1, 1, 1);
        this.el.setObject3D("selfieScreen", selfieScreen);

        this.updateRenderTargetNextTick = true;
      },
      { once: true }
    );
  },

  play() {
    this.el.addEventListener("stateadded", this.stateAdded);
  },

  pause() {
    this.el.removeEventListener("stateadded", this.stateAdded);
  },

  stateAdded(evt) {
    if (evt.detail === "activated") {
      this.takeSnapshotNextTick = true;
    }
  },

  tock() {
    const sceneEl = this.el.sceneEl;
    const renderer = this.renderer || sceneEl.renderer;
    const now = performance.now();

    if (!this.playerHead) {
      const headEl = document.getElementById("player-head");
      this.playerHead = headEl && headEl.object3D;
    }

    if (this.takeSnapshotNextTick || this.updateRenderTargetNextTick) {
      const tempScale = new THREE.Vector3();
      if (this.playerHead) {
        tempScale.copy(this.playerHead.scale);
        this.playerHead.scale.set(1, 1, 1);
      }
      const tmpVRFlag = renderer.vr.enabled;
      const tmpOnAfterRender = sceneEl.object3D.onAfterRender;
      delete sceneEl.object3D.onAfterRender;
      renderer.vr.enabled = false;
      renderer.render(sceneEl.object3D, this.camera, this.renderTarget, true);
      renderer.vr.enabled = tmpVRFlag;
      sceneEl.object3D.onAfterRender = tmpOnAfterRender;
      if (this.playerHead) {
        this.playerHead.scale.copy(tempScale);
      }
      this.lastUpdate = now;
      this.updateRenderTargetNextTick = false;
    }

    if (this.takeSnapshotNextTick) {
      const width = this.renderTarget.width;
      const height = this.renderTarget.height;
      if (!this.snapPixels) {
        this.snapPixels = new Uint8Array(width * height * 4);
      }
      renderer.readRenderTargetPixels(this.renderTarget, 0, 0, width, height, this.snapPixels);
      pixelsToPNG(this.snapPixels, width, height).then(file => {
        const { entity, orientation } = addMedia(file, "#interactable-media", undefined, true);
        orientation.then(() => {
          entity.object3D.position.copy(this.el.object3D.position);
          entity.object3D.rotation.copy(this.el.object3D.rotation);
          entity.components["sticky-object"].setLocked(false);
          sceneEl.emit("object_spawned", { objectType: ObjectTypes.CAMERA });
        });
      });
      this.takeSnapshotNextTick = false;
    }
  }
});
