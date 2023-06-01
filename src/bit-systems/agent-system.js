import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { Agent, Hidden, Interacted } from "../bit-components";
import { FromatNewText, UpdateTextSystem, lowerIndex, raiseIndex } from "./agent-slideshow-system";
import { hasComponent } from "bitecs";
import { paradigms } from "./text-paradigms";
import { anyEntityWith } from "../utils/bit-utils";

const agentQuery = defineQuery([Agent]);
const enterAgentQuery = enterQuery(agentQuery);

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

function recordUser() {
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
    chunks = saveRecording(recordingBlob);
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

function saveRecording(blob) {
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "recording.wav";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Clean up
  URL.revokeObjectURL(url);

  return [];
}

function setMicStatus(world) {
  const agenteid = anyEntityWith(world, Agent);
  const micEid = Agent.micRef[agenteid];
  const micObj = world.eid2obj.get(micEid);
  micObj.visible = APP.mediaDevicesManager.isMicEnabled;
}

function entered(world) {
  enterAgentQuery(world).forEach(agentEid => {
    const sliceref = Agent.panelRef[agentEid];
    const panelObj = world.eid2obj.get(sliceref);
    const axesHelper = new THREE.AxesHelper(5);
    panelObj.add(axesHelper);
    eid = agentEid;
    APP.dialog.on("mic-state-changed", () => setMicStatus(world));
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
    if (!isRecording) recordUser();
    else stopRecording();
  }

  agentObj.updateMatrix();
}

// let newText = paradigms[getRandomInt(paradigms.length)];

// const renderArrows = UpdateTextSystem(world, FromatNewText(newText));

// if (renderArrows) {
//   hideArrows(world, Agent.prevRef[eid], Agent.nextRef[eid]);
// } else showArrows(world, Agent.prevRef[eid], Agent.nextRef[eid]);
