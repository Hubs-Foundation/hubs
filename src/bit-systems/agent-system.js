import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { Agent, Hidden, Interacted } from "../bit-components";
import { lowerIndex, raiseIndex } from "./agent-slideshow-system";
import { hasComponent } from "bitecs";
import { PermissionStatus } from "../utils/media-devices-utils";
import { stageUpdate } from "../systems/single-action-button-system";
import { custom_fragment, custom_vertex } from "../utils/custom-shaders";
import { nmtModule, routerModule, toggleRecording, vlModule } from "../utils/asr-adapter";
import { ASR, LANGUAGES, RECORDER_CODES, VL_TEXT, VL } from "../utils/ml-types";

const startWidth = window.innerWidth;
const startHeight = window.innerHeight;

const agentQuery = defineQuery([Agent]);
const enterAgentQuery = enterQuery(agentQuery);
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

let mediaRecorder, eid, width, height;
let prevArrowRef, nextArrowRef, modelref, agentObj, avatarPovObj, micButtonRef, snapButtonRef;
let camera, scene, renderer;
let prevArrowObj, nextArrowObj, modelObj, panelObj;

function clicked(eid) {
  return hasComponent(APP.world, Interacted, eid);
}

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

async function POV(agentObj, savefile) {
  return new Promise((resolve, reject) => {
    const renderer = AFRAME.scenes[0].renderer;
    const scene = AFRAME.scenes[0].object3D;
    const camera = AFRAME.scenes[0].camera;
    agentObj.visible = false;
    renderer.render(scene, camera);
    const canvas = renderer.domElement;
    canvas.toBlob(async blob => {
      if (blob) {
        if (savefile) {
          const formData = new FormData();
          formData.append("file", blob, "camera_pov.png");

          const downloadLink = document.createElement("a");
          downloadLink.href = URL.createObjectURL(blob);
          downloadLink.download = "camera_pov.png";
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

async function DepthPOV(savefile) {
  return new Promise((resolve, reject) => {
    width = window.innerWidth;
    height = window.innerHeight;

    const renderer = AFRAME.scenes[0].renderer;
    const scene = AFRAME.scenes[0].object3D;
    const camera = AFRAME.scenes[0].camera;

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

    renderer.setRenderTarget(depthRenderTarget);
    renderer.render(scene, camera);

    renderer.setRenderTarget(null);
    renderer.render(orthoScene, orthoCamera);

    const canvas = renderer.domElement;
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

function setMicStatus(world) {
  const micEid = Agent.micRef[eid];
  const micObj = world.eid2obj.get(micEid);
  const permissionsGranted = APP.mediaDevicesManager.getPermissionsStatus("microphone") === PermissionStatus.GRANTED;
  const isMicNotDisabled = APP.mediaDevicesManager.isMicEnabled !== false;
  micObj.visible = permissionsGranted && isMicNotDisabled;
}

function entered(world) {
  enterAgentQuery(world).forEach(agentEid => {
    eid = agentEid;
    nextArrowRef = Agent.nextRef[eid];
    prevArrowRef = Agent.prevRef[eid];
    micButtonRef = Agent.micRef[eid];
    snapButtonRef = Agent.snapRef[eid];
    modelref = Agent.modelRef[eid];
    agentObj = world.eid2obj.get(eid);
    modelObj = world.eid2obj.get(modelref);
    panelObj = world.eid2obj.get(Agent.panelRef[eid]);
    // modelObj = agentObj;
    scene = AFRAME.scenes[0];
    camera = scene.camera;
    renderer = scene.renderer;
    avatarPovObj = document.querySelector("#avatar-pov-node").object3D;
    APP.dialog.on("mic-state-changed", () => setMicStatus(world));
    setMicStatus(world);
  });

  if (eid) return true;
  else return false;
}

export function AgentSystem(world) {
  if (!entered(world) || hasComponent(world, Hidden, eid)) return;

  const agentPos = agentObj.getWorldPosition(new THREE.Vector3());
  const avatarPos = avatarPovObj.getWorldPosition(new THREE.Vector3());
  const dist = agentPos.distanceTo(avatarPos);

  if (dist > 2) {
    const dir = new THREE.Vector3().subVectors(avatarPos, agentPos).normalize();
    const newPos = new THREE.Vector3().copy(avatarPos.sub(dir.multiplyScalar(2)));
    agentObj.position.copy(newPos);
  }

  if (dist < 0.3) {
    agentObj.visible = false;
  } else {
    agentObj.visible = true;
  }
  // panelObj.rotateOnAxis(new THREE.Vector3(0, 1, 0), -1.5707963268);
  // modelObj.rotateOnAxis(new THREE.Vector3(0, 1, 0), -1.5707963268);

  if (clicked(nextArrowRef)) raiseIndex();
  if (clicked(prevArrowRef)) lowerIndex();

  if (clicked(micButtonRef)) {
    stageUpdate();

    toggleRecording(true)
      .then(result => {
        console.log(result);
        if (result.status.code === RECORDER_CODES.SUCCESSFUL) {
          nmtModule(result, LANGUAGES.SPANISH, ASR.TRANSCRIBE_AUDIO_FILES)
            .then(asrResult => {
              console.log(asrResult);
              routerModule(asrResult)
                .then(routerResults => {
                  console.log(routerResults);
                })
                .catch(routerError => {
                  console.log(routerError);
                });
            })
            .catch(asrError => {
              console.log(asrError);
            });
        }
      })
      .catch(error => {
        console.log(error);
      });
  }

  if (clicked(snapButtonRef)) {
    Promise.all([POV(agentObj, false), DepthPOV(false)])
      .then(values => {
        vlModule(values[0], VL.GPT)
          .then(snapResponse => {
            console.log(snapResponse);
          })
          .catch(snapError => {
            console.log(snapError);
          });
      })
      .catch(error => {
        console.log(error);
      });
  }

  agentObj.updateMatrix();
}
export function handleArrows(world, renderArrows) {
  world.eid2obj.get(nextArrowRef).visible = renderArrows;
  world.eid2obj.get(prevArrowRef).visible = renderArrows;
}

const mode = {
  greeting: 0,
  idle: 1,
  listening: 2,
  navigation: 3
};

export default class VirtualAgent {
  constructor() {
    this.entered = false;
  }

  Enter(eid) {
    this.eid = eid;
    this.entered = true;
    this.visible = false;
    this.mode = mode.greeting;
  }
}

export const virtualAgent = new VirtualAgent();
