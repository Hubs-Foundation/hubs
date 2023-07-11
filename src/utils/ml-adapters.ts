import { Object3D, PerspectiveCamera } from "three";
import { HubsWorld } from "../app";

export enum ASR_MODULES {
  TRANSLATE_AUDIO = "TRANSLATE_AUDIO",
  TRANSLATE_TEXT = "TRANSLATE_TEXT",
  TRANSCRIBE_AUDIO_FILE = "TRANSCRIBE_AUDIO_FILE",
  TRANSLATE_AUDIO_FILE = "TRANSLATE_AUDIO_FILE"
}
export enum RESPONSES {
  STOP = "RECORDING_STOPPED",
  RESULT = "RESPONSE_READY"
}

export enum ERRORS {
  MEDIA_RECORDER = "MEDIA_RECORDER_ERROR",
  API_FAIL = "API_ERROR"
}

export enum VL_MODULES {
  LXMERT = "LXMERT",
  GPT = "GPT"
}

type ASRmodule = ASR_MODULES;
type ASRresponse = ERRORS | RESPONSES;
type VLmodule = VL_MODULES;

interface ML_RESPONSE {
  component: ASRmodule;
  type: ASRresponse;
  data: string;
}

let mediaRecorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
export let isRecording = false;
let recordingPromise: Promise<ML_RESPONSE>;

export async function toggleRecording(savefile: boolean): Promise<ML_RESPONSE> {
  if (!isRecording) {
    recordingPromise = startRecording(savefile);
    return recordingPromise;
  } else {
    stopRecording();
    return Promise.resolve({
      component: ASR_MODULES.TRANSCRIBE_AUDIO_FILE,
      type: RESPONSES.STOP,
      data: "Recording Stopped"
    });
  }
}

async function startRecording(savefile: boolean): Promise<ML_RESPONSE> {
  return new Promise((resolve, reject) => {
    const audioTrack = APP.mediaDevicesManager!.audioTrack;
    const recordingTrack = audioTrack.clone();
    const recordingStream = new MediaStream([recordingTrack]);
    mediaRecorder = new MediaRecorder(recordingStream);
    audioTrack.enabled = false;

    mediaRecorder.ondataavailable = function (e) {
      if (isRecording) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const recordingBlob = new Blob(chunks, { type: "audio/wav" });
      audioTrack.enabled = true;
      recordingStream.removeTrack(recordingTrack);
      recordingTrack.stop();
      if (savefile) {
        saveAudio(recordingBlob);
      }
      inferenceAudio(recordingBlob)
        .then(inferenceResult => {
          resolve({
            component: ASR_MODULES.TRANSCRIBE_AUDIO_FILE,
            type: RESPONSES.RESULT,
            data: inferenceResult
          });
        })
        .catch(error => {
          resolve({
            component: ASR_MODULES.TRANSCRIBE_AUDIO_FILE,
            type: ERRORS.API_FAIL,
            data: error.toString()
          });
        });
    };

    mediaRecorder.onerror = event => {
      reject({
        component: ASR_MODULES.TRANSCRIBE_AUDIO_FILE,
        type: ERRORS.MEDIA_RECORDER,
        data: ""
      });
      console.log(event);
    };

    mediaRecorder.start();
    isRecording = true;
  });
}

function stopRecording() {
  mediaRecorder!.stop();
  isRecording = false;
}

async function inferenceAudio(blob: Blob): Promise<string> {
  const apiURL = "https://192.168.169.219:8000/transcribe_audio_files";
  const formData = new FormData();
  const sourceLanguage = "el";
  formData.append("audio_files", blob, "recording.wav");

  const response = await fetch(apiURL + "?source_language=" + sourceLanguage, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw response.text();
  }

  const data = await response.json();
  const responseText: string = data.transcriptions[0];

  return responseText;
}

function saveAudio(blob: Blob) {
  const blobUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = blobUrl;
  downloadLink.download = "recording.wav";
  downloadLink.click();
  URL.revokeObjectURL(blobUrl);
}

export function snapPOV(world: HubsWorld, agentObj: Object3D, camera: PerspectiveCamera) {
  const renderer = AFRAME.scenes[0].renderer;
  const scene = AFRAME.scenes[0].object3D;

  agentObj.visible = false;
  renderer.render(scene, camera);

  return new Promise<Blob | null>((resolve, reject) => {
    renderer.render(scene, camera);

    const canvas = renderer.domElement;
    canvas.toBlob(async blob => {
      if (blob) {
        const formData = new FormData();
        formData.append("file", blob, "camera_pov.png");

        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = "camera_pov.png";
        downloadLink.click();

        // Revoke the object URL
        URL.revokeObjectURL(downloadLink.href);

        resolve(blob);
      } else {
        reject(new Error("Failed to generate blob"));
      }
    }, "image/png");
  });
}

export function vlModel(type: VL_MODULES, saveSnaps: boolean) {}
