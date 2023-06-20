import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { Agent, Hidden, Interacted } from "../bit-components";
import { FromatNewText, UpdateTextSystem, lowerIndex, raiseIndex } from "./agent-slideshow-system";
import { hasComponent } from "bitecs";
import { PermissionStatus } from "../utils/media-devices-utils";
import { paradigms } from "./text-paradigms";
import { anyEntityWith } from "../utils/bit-utils";

const agentQuery = defineQuery([Agent]);
const enterAgentQuery = enterQuery(agentQuery);

let flag = false;

function clicked(eid) {
  return hasComponent(APP.world, Interacted, eid);
}

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function setArrows(world, prevArrowEid, nextArrowEid, value) {
  world.eid2obj.get(prevArrowEid).visible = value;
  world.eid2obj.get(nextArrowEid).visible = value;
}

function snapPOV() {
  const renderer = AFRAME.scenes[0].renderer;
  const pictureUrl = renderer.domElement.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = pictureUrl;
  link.download = "camera_pov.png";
  link.click();
  flag = !flag;
}

function recordUser(world) {
  isRecording = true;
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
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
}

async function saveRecording(world, blob) {
  const apiURL = "http:/localhost:8888/transcribe_audio_files";

  const headers = new Headers();
  const formData = new FormData();

  const sourceLanguage = "el";

  formData.append("audio_files", blob, "recording.wav");

  const hie = fetch(apiURL + "?source_language=" + sourceLanguage, { method: "POST", body: formData })
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
      console.log(error);
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
    const sliceref = Agent.panelRef[agentEid];
    const panelObj = world.eid2obj.get(sliceref);
    const axesHelper = new THREE.AxesHelper(5);
    panelObj.add(axesHelper);
    eid = agentEid;
    APP.dialog.on("mic-state-changed", () => setMicStatus(world));
    setMicStatus(world);
  });

  if (eid) return true;
  else return false;
}

export let isRecording = false;
let mediaRecorder;
let eid;

export function AgentSystem(world) {
  if (!entered(world) || hasComponent(world, Hidden, eid)) return;

  const modelref = Agent.modelRef[eid];
  const agentObj = world.eid2obj.get(eid);
  const modelObj = world.eid2obj.get(modelref);
  const avatarPovObj = document.querySelector("#avatar-pov-node").object3D;
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

  if (clicked(Agent.nextRef[eid])) {
    raiseIndex();
  }

  if (clicked(Agent.prevRef[eid])) {
    lowerIndex();
  }

  if (clicked(Agent.micRef[eid])) {
    // if (!isRecording) recordUser(world);
    // else stopRecording();
    snapPOV();
  }

  agentObj.updateMatrix();
}

// let newText = paradigms[getRandomInt(paradigms.length)];

// const renderArrows = UpdateTextSystem(world, FromatNewText(newText));

// if (renderArrows) {
//   hideArrows(world, Agent.prevRef[eid], Agent.nextRef[eid]);
// } else showArrows(world, Agent.prevRef[eid], Agent.nextRef[eid]);

const renderer = new THREE.WebGLRenderer();
const depthShader = {
  uniforms: {
    tDepth: { value: null },
    nearClip: { value: 0 },
    farClip: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tDepth;
    uniform float nearClip;
    uniform float farClip;
    void main() {
      float depth = texture2D(tDepth, vUv).r;
      float viewZ = perspectiveDepthToViewZ(depth, nearClip, farClip);
      gl_FragColor = vec4(vec3(viewZ), 1.0);
    }
  `
};

export function getDepthMap(camera, scene) {
  if (!flag) return;

  const height = camera.getFilmHeight();
  const width = camera.getFilmWidth();
  const depthMaterial = new THREE.ShaderMaterial(depthShader);
  const renderer = AFRAME.scenes[0].renderer;

  const depthRenderTarget = new THREE.WebGLRenderTarget(width, height, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType
  });

  // Create a custom depth material

  // Create a render target to store the depth values

  renderer.setRenderTarget(depthRenderTarget);

  renderer.render(scene, camera);

  depthShader.uniforms.tDepth.value = depthRenderTarget.texture;
  depthShader.uniforms.nearClip.value = camera.near;
  depthShader.uniforms.farClip.value = camera.far;

  snapPOV();

  // Render the scene as usual
  renderer.setRenderTarget(null);
}
