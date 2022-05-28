import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { CameraTool, Interacted } from "../bit-components";

const RENDER_WIDTH = 1280;
const RENDER_HEIGHT = 720;

const renderTargets = new Map();

function click(eid) {
  return hasComponent(APP.world, Interacted, eid);
}

const cameraToolQuery = defineQuery([CameraTool]);
const cameraToolEnterQuery = enterQuery(cameraToolQuery);
const cameraToolExitQuery = exitQuery(cameraToolQuery);

export function cameraSystem(world) {
  cameraToolEnterQuery(world).forEach(function(eid) {
    const renderTarget = new THREE.WebGLRenderTarget(RENDER_WIDTH, RENDER_HEIGHT, {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      encoding: THREE.GammaEncoding,
      depth: false,
      stencil: false
    });

    // Bit of a hack here to only update the renderTarget when the screens are in view
    // renderTarget.texture.isVideoTexture = true;
    // renderTarget.texture.update = () => {
    // if (this.showCameraViewfinder) {
    //   this.viewfinderInViewThisFrame = true;
    // }
    // };

    const screenObj = world.eid2obj.get(CameraTool.screenRef[eid]);
    const selfieScreenObj = world.eid2obj.get(CameraTool.selfieScreenRef[eid]);
    screenObj.material.map = renderTarget.texture;
    selfieScreenObj.material.map = renderTarget.texture;

    renderTargets.set(eid, renderTarget);
  });

  cameraToolEnterQuery(world).forEach(function(eid) {
    const renderTarget = renderTargets.get(eid);
    renderTarget.dispose();
    renderTargets.delete(eid);
  });

  cameraToolQuery(world).forEach(camera => {
    if (click(CameraTool.button_cancel[camera])) {
      console.log("Button Cancel Pressed!");
    }

    if (click(CameraTool.button_next[camera])) {
      console.log("Button Next Pressed!");
    }

    if (click(CameraTool.button_prev[camera])) {
      console.log("Button Prev Pressed!");
    }

    const sceneEl = AFRAME.scenes[0];
    const renderer = AFRAME.scenes[0].renderer;

    const tmpVRFlag = renderer.xr.enabled;
    const tmpOnAfterRender = sceneEl.object3D.onAfterRender;
    const tmpAutoUpdate = sceneEl.object3D.autoUpdate;
    delete sceneEl.object3D.onAfterRender;
    renderer.xr.enabled = false;

    // The entire scene graph matrices should already be updated
    // in tick(). They don't need to be recomputed again in tock().
    sceneEl.object3D.autoUpdate = false;

    // if (allowVideo && this.videoRecorder && !this.videoRenderTarget) {
    //   // Create a separate render target for video because we need to flip and (sometimes) downscale it before
    //   // encoding it to video.
    //   this.videoRenderTarget = new THREE.WebGLRenderTarget(CAPTURE_WIDTH, CAPTURE_HEIGHT, {
    //     format: THREE.RGBAFormat,
    //     minFilter: THREE.LinearFilter,
    //     magFilter: THREE.NearestFilter,
    //     encoding: THREE.sRGBEncoding,
    //     depth: false,
    //     stencil: false
    //   });

    //   // Used to set up framebuffer in three.js as a side effect
    //   renderer.setRenderTarget(this.videoRenderTarget);
    // }
    const cameraObj = world.eid2obj.get(CameraTool.cameraRef[camera]);

    renderer.setRenderTarget(renderTargets.get(camera));
    renderer.render(sceneEl.object3D, cameraObj);
    renderer.setRenderTarget(null);

    renderer.xr.enabled = tmpVRFlag;
    sceneEl.object3D.onAfterRender = tmpOnAfterRender;
    sceneEl.object3D.autoUpdate = tmpAutoUpdate;
  });
}
