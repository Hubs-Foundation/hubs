import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { Agent, Hidden, Interacted } from "../bit-components";
import { FromatNewText, UpdateTextSystem, lowerIndex, raiseIndex } from "./agent-slideshow-system";
import { hasComponent } from "bitecs";
import { PermissionStatus } from "../utils/media-devices-utils";

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
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    #include <packing>  
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform float cameraNear;
    uniform float cameraFar;

    float readDepth( sampler2D depthSampler, vec2 coord ) {
      float fragCoordZ = texture2D( depthSampler, coord ).x;
      float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
      return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
    } 
    
    void main() {
      float depth = readDepth(tDepth, vUv);
      float normalizedDepth = (depth - cameraNear) / (cameraFar - cameraNear);
      gl_FragColor.rgb = vec3(1.0-depth);
      gl_FragColor.a = 1.0;
  }  
  `,
  uniforms: {
    cameraNear: { value: 0.1 },
    cameraFar: { value: 20 },
    tDiffuse: { value: null },
    tDepth: { value: null }
  }
});

let mediaRecorder, eid, width, height;
let prevArrowRef, nextArrowRef, modelref, agentObj, avatarPovObj, micButtonRef, snapButtonRef;
let prevArrowObj, nextArrowObj, modelObj;

export let updateButton = false;
export let isRecording = false;

export function ToggleUpdateButton() {
  updateButton = !updateButton;
}

function clicked(eid) {
  return hasComponent(APP.world, Interacted, eid);
}

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function captureDepthPOV() {
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

  const pictureUrl = renderer.domElement.toDataURL("image/png");
  const link = document.createElement("a");

  link.href = pictureUrl;
  link.download = "depth.png";
  link.click();
}

function snapPOV(world, agentObj) {
  const renderer = AFRAME.scenes[0].renderer;
  const scene = AFRAME.scenes[0].object3D;
  const camera = AFRAME.scenes[0].camera;

  agentObj.visible = false;
  renderer.render(scene, camera);

  const canvas = renderer.domElement;
  canvas.toBlob(blob => {
    const formData = new FormData();
    formData.append("file", blob, "camera_pov.png");
    const apiEndpoint = "https://192.168.169.219:5035/cap_lxmert/";

    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = "camera_pov.png";
    downloadLink.click();

    // Revoke the object URL
    URL.revokeObjectURL(downloadLink.href);

    fetch(apiEndpoint, {
      method: "POST",
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          console.log("Error posting image to API");
        }
        return response.json();
      })
      .then(data => {
        console.log(data["Prediction by LXMERT"]);
        UpdateTextSystem(world, data["Prediction by LXMERT"]);
      })
      .catch(error => {
        console.log("VLMODEL: something went wrong");
        UpdateTextSystem(world, FromatNewText("Something went wrong when trying to connect to the VLmodel API"));
      });
  }, "image/png");
}

function recordUser(world) {
  isRecording = true;
  ToggleUpdateButton();
  console.log("Recording...", isRecording, updateButton);
  const audioTrack = APP.mediaDevicesManager.audioTrack;
  const recordingTrack = audioTrack.clone();
  const recordingStream = new MediaStream([recordingTrack]);
  mediaRecorder = new MediaRecorder(recordingStream);

  audioTrack.enabled = false;

  mediaRecorder.start();

  let chunks = [];
  mediaRecorder.ondataavailable = function (e) {
    chunks.push(e.data);
  };

  mediaRecorder.onstop = function () {
    const recordingBlob = new Blob(chunks, { type: "audio/wav" });
    chunks = saveRecording(world, recordingBlob);
    audioTrack.enabled = true;
    recordingStream.removeTrack(recordingTrack);
    recordingTrack.stop();
  };
}

function stopRecording() {
  isRecording = false;
  ToggleUpdateButton();
  console.log("Recording...", isRecording, updateButton);

  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
}

async function saveRecording(world, blob) {
  const blobUrl = URL.createObjectURL(blob);

  // Create a link element
  const downloadLink = document.createElement("a");

  // Set the link's href and download attributes
  downloadLink.href = blobUrl;
  downloadLink.download = "recording.wav";

  // Simulate a click on the link to trigger the download
  downloadLink.click();

  // Clean up the URL object
  URL.revokeObjectURL(blobUrl);

  const apiURL = "0.0.0.0:8888/transcribe_audio_files";
  const formData = new FormData();
  const sourceLanguage = "el";
  formData.append("audio_files", blob, "recording.wav");

  fetch(apiURL + "?source_language=" + sourceLanguage, { method: "POST", body: formData })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("Error: " + response.status);
      }
    })
    .then(data => {
      const responseText = data.transcriptions[0];
      UpdateTextSystem(world, FromatNewText(responseText));
    })
    .catch(error => {
      console.log("Failed to connect to the API");
      UpdateTextSystem(world, FromatNewText("Failed to connect to the ASR API"));
    });

  return [];
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

  modelObj.rotateOnAxis(new THREE.Vector3(0, 1, 0), -1.5707963268);

  if (clicked(nextArrowRef)) raiseIndex();
  if (clicked(prevArrowRef)) lowerIndex();

  if (clicked(micButtonRef)) {
    if (!isRecording) recordUser(world);
    else stopRecording();
  }

  if (clicked(snapButtonRef)) {
    snapPOV(world, agentObj);
    captureDepthPOV();
  }

  agentObj.updateMatrix();
}
export function handleArrows(world, renderArrows) {
  world.eid2obj.get(nextArrowRef).visible = renderArrows;
  world.eid2obj.get(prevArrowRef).visible = renderArrows;
}
