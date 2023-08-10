import { virtualAgent } from "../bit-systems/agent-system";
import { custom_fragment, custom_vertex } from "./custom-shaders";

const startWidth = window.innerWidth;
const startHeight = window.innerHeight;

const orthoScene = new THREE.Scene();
const planeGeometry = new THREE.PlaneGeometry(startWidth, startHeight);
const basicMat = new THREE.MeshBasicMaterial();
const plane = new THREE.Mesh(planeGeometry, basicMat);
const orthoCamera = new THREE.OrthographicCamera(
  -startWidth / 2,
  startWidth / 2,
  startHeight / 2,
  -startHeight / 2,
  0.1,
  1000
);

const orthoRenderTarget = new THREE.WebGLRenderTarget(5, 5);
const depthRenderTarget = new THREE.WebGLRenderTarget(5, 5);

const postMaterial = new THREE.ShaderMaterial({
  vertexShader: custom_vertex,
  fragmentShader: custom_fragment,
  uniforms: {
    cameraNear: { value: 0.1 },
    cameraFar: { value: 20 },
    tDiffuse: { value: null },
    tDepth: { value: null }
  }
});

depthRenderTarget.texture.minFilter = THREE.NearestFilter;
depthRenderTarget.texture.magFilter = THREE.NearestFilter;
depthRenderTarget.stencilBuffer = THREE.DepthFormat === THREE.DepthStencilFormat ? true : false;
depthRenderTarget.depthTexture = new THREE.DepthTexture();
depthRenderTarget.depthTexture.format = parseFloat(THREE.DepthFormat);
depthRenderTarget.depthTexture.type = parseFloat(THREE.UnsignedShortType);

orthoRenderTarget.texture.format = THREE.RGBAFormat;
orthoRenderTarget.texture.minFilter = THREE.LinearFilter;

orthoCamera.position.z = 5;
orthoScene.add(plane);

export async function SnapPOV(agentObj, savefile) {
  return new Promise((resolve, reject) => {
    agentObj.visible = false;

    virtualAgent.renderer.render(virtualAgent.scene.object3D, virtualAgent.camera);
    const canvas = virtualAgent.renderer.domElement;
    canvas.toBlob(async blob => {
      if (blob) {
        if (savefile) {
          const formData = new FormData();
          formData.append("file", blob, "camera_pov.png");

          const downloadLink = document.createElement("a");
          downloadLink.href = URL.createObjectURL(blob);
          downloadLink.download = "camera_pov.png";
          downloadLink.click();

          URL.revokeObjectURL(downloadLink.href);
        }
        resolve(blob);
      } else {
        reject(new Error("Failed to generate pov"));
      }
    }, "image/png");
  });
}

export async function SnapDepthPOV(savefile) {
  return new Promise((resolve, reject) => {
    let width = window.innerWidth;
    let height = window.innerHeight;

    orthoRenderTarget.setSize(width, height);
    depthRenderTarget.setSize(width, height);

    if (width / 2 !== orthoCamera.right || height / 2 !== orthoCamera.top) {
      Object.assign(orthoCamera, {
        left: -width / 2,
        right: width / 2,
        top: height / 2,
        bottom: -height / 2
      });
    }

    plane.geometry.parameters.width = width;
    plane.geometry.parameters.height = height;

    postMaterial.uniforms.tDiffuse.value = depthRenderTarget.texture;
    postMaterial.uniforms.tDepth.value = depthRenderTarget.depthTexture;
    plane.material = postMaterial;

    virtualAgent.renderer.setRenderTarget(depthRenderTarget);
    virtualAgent.renderer.render(virtualAgent.scene.object3D, virtualAgent.camera);

    virtualAgent.renderer.setRenderTarget(null);
    virtualAgent.renderer.render(orthoScene, orthoCamera);

    const canvas = virtualAgent.renderer.domElement;
    canvas.toBlob(async blob => {
      if (blob) {
        if (savefile) {
          const formData = new FormData();
          formData.append("file", blob, "depth_pov.png");

          const downloadLink = document.createElement("a");
          downloadLink.href = URL.createObjectURL(blob);
          downloadLink.download = "depth_pov.png";
          downloadLink.click();

          // Revoke the object URL
          URL.revokeObjectURL(downloadLink.href);
        }
        resolve(blob);
      } else {
        reject(new Error("Failed to generate pov"));
      }
    }, "image/png");
  });
}
