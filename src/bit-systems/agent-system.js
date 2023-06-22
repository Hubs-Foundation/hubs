import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { Agent, Hidden, Interacted } from "../bit-components";
import { FromatNewText, UpdateTextSystem, lowerIndex, raiseIndex } from "./agent-slideshow-system";
import { hasComponent } from "bitecs";
import { PermissionStatus } from "../utils/media-devices-utils";

const agentQuery = defineQuery([Agent]);
const enterAgentQuery = enterQuery(agentQuery);
const params = {
  format: THREE.DepthFormat,
  type: THREE.UnsignedShortType
};

let target, plane, format, type, depthTexture, postMaterial, mediaRecorder, eid;

export let isRecording = false;

function init() {
  format = parseFloat(params.format);
  type = parseFloat(params.type);

  target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
  target.texture.minFilter = THREE.NearestFilter;
  target.texture.magFilter = THREE.NearestFilter;
  target.stencilBuffer = format === THREE.DepthStencilFormat ? true : false;
  target.depthTexture = new THREE.DepthTexture();
  target.depthTexture.format = format;
  target.depthTexture.type = type;

  depthTexture = target.depthTexture;
  postMaterial = new THREE.ShaderMaterial({
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
}

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

function captureDepthPOV() {
  const renderer = AFRAME.scenes[0].renderer;
  const scene = AFRAME.scenes[0].object3D;
  const camera = AFRAME.scenes[0].camera;

  if (target) target.dispose();
  scene.remove(plane);

  renderer.setRenderTarget(target);
  renderer.render(scene, camera);

  var planeGeometry = new THREE.PlaneGeometry(8, 4.5);
  postMaterial.uniforms.tDiffuse.value = target.texture;
  postMaterial.uniforms.tDepth.value = target.depthTexture;
  plane = new THREE.Mesh(planeGeometry, postMaterial);
  scene.add(plane);

  renderer.setRenderTarget(null);
  renderer.render(scene, camera);
}

function snapPOV() {}

// Save POV as image
// const pictureUrl = renderer.domElement.toDataURL("image/png");
// const link = document.createElement("a");
// link.href = pictureUrl;
// link.download = "camera_pov.png";
// link.click();

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
    // snapPOV();
    captureDepthPOV();
  }

  agentObj.updateMatrix();
}

// let newText = paradigms[getRandomInt(paradigms.length)];

// const renderArrows = UpdateTextSystem(world, FromatNewText(newText));

// if (renderArrows) {
//   hideArrows(world, Agent.prevRef[eid], Agent.nextRef[eid]);
// } else showArrows(world, Agent.prevRef[eid], Agent.nextRef[eid]);

init();
