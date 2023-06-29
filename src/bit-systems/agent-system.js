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
export let isRecording = false;

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

function snapPOV(agentObj) {
  const renderer = AFRAME.scenes[0].renderer;
  const scene = AFRAME.scenes[0].object3D;
  const camera = AFRAME.scenes[0].camera;

  agentObj.visible = false;
  renderer.render(scene, camera);

  const pictureUrl = renderer.domElement.toDataURL("image/png");
  const canvas = renderer.domElement;
  canvas.toBlob(blob => {
    // Step 2: Create FormData object and append the Blob
    const formData = new FormData();
    formData.append("file", blob, "camera_pov.png");

    // Step 3: Send the FormData to the API using fetch
    const apiEndpoint = "https://192.168.169.219:5035/cap_lxmert/"; // Replace with your API endpoint

    fetch(apiEndpoint, {
      method: "POST",
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Error posting image to API");
        }
        return response.json();
      })
      .then(data => {
        // Handle the API response
        console.log(data);
      })
      .catch(error => {
        // Handle any errors that occur during the fetch request
        console.error(error);
      });
  }, "image/png");

  // const formData = new FormData();
  // formData.append('file', blob, 'camera_pov.png');
  // const requestData = { file: pictureUrl };

  // //send to api

  // const apiURL = "https://192.168.169.219:5035/cap_lxmert/";

  // fetch(apiURL, { method: "POST", headers: { "Content-type": "multipart/form-data" }, JSON.stringify(requestData)})
  //   .then(response => {
  //     if (response.ok) {
  //       return response.json();
  //     } else {
  //       throw new Error("Error: " + response.status);
  //     }
  //   })
  //   .then(data => {
  //     const responseText = data.transcriptions[0];
  //     UpdateTextSystem(world, FromatNewText(responseText));
  //   })
  //   .catch(error => {
  //     console.log(error);
  //   });

  // const link = document.createElement("a");

  // link.href = pictureUrl;
  // link.download = "camera_pov.png";
  // link.click();
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

    snapPOV(agentObj);
    captureDepthPOV();
  }

  agentObj.updateMatrix();
}

// let newText = paradigms[getRandomInt(paradigms.length)];

// const renderArrows = UpdateTextSystem(world, FromatNewText(newText));

// if (renderArrows) {
//   hideArrows(world, Agent.prevRef[eid], Agent.nextRef[eid]);
// } else showArrows(world, Agent.prevRef[eid], Agent.nextRef[eid]);
