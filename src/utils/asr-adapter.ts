import { string } from "prop-types";
import { Object3D, PerspectiveCamera, WebGLRenderer } from "three";
import {
  LANGUAGES,
  ResponseData,
  RECORDER_CODES,
  RECORDER_TEXT,
  ASR_MODULES,
  ASR,
  ASR_CODES,
  ASR_TEXT,
  TASK,
  TASK_DESCRIPT,
  VL_MODULES,
  VL,
  VL_CODES,
  VL_TEXT
} from "./ml-types";
import { HubsWorld } from "../app";
import { sceneGraph } from "../bit-systems/routing-system";
import { virtualAgent } from "../bit-systems/agent-system";

let mediaRecorder: MediaRecorder | null = null;
let chunks: any[] = [];
export let isRecording = false;
let recordingPromise: Promise<any>;

//TODO: automate the query parameters
export function queryPreprocess() {}

export async function toggleRecording(savefile: boolean): Promise<ResponseData> {
  if (!isRecording) {
    recordingPromise = startRecording(savefile);
    return recordingPromise;
  } else {
    stopRecording();
    return Promise.resolve({
      status: { code: RECORDER_CODES.STOP, text: RECORDER_TEXT[RECORDER_CODES.STOP] }
    });
  }
}

async function startRecording(savefile: boolean): Promise<ResponseData> {
  return new Promise((resolve, reject) => {
    const audioTrack = APP.mediaDevicesManager!.audioTrack;
    const recordingTrack = audioTrack.clone();
    const recordingStream = new MediaStream([recordingTrack]);
    mediaRecorder = new MediaRecorder(recordingStream);
    audioTrack.enabled = false;

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const recordingBlob = new Blob(chunks, { type: "audio/wav" });
      chunks.length = 0;
      audioTrack.enabled = true;
      recordingStream.removeTrack(recordingTrack);
      recordingTrack.stop();
      if (savefile) {
        saveAudio(recordingBlob);
      }

      resolve({
        status: { code: RECORDER_CODES.SUCCESSFUL, text: RECORDER_TEXT[RECORDER_CODES.SUCCESSFUL] },
        data: { file: recordingBlob }
      });
    };

    mediaRecorder.onerror = event => {
      reject({
        status: { code: RECORDER_CODES.ERROR, text: RECORDER_TEXT[RECORDER_CODES.ERROR] }
      });
      console.log(event);
    };

    isRecording = true;
    mediaRecorder.start();
  });
}

function stopRecording() {
  mediaRecorder!.stop();
  isRecording = false;
}

function saveAudio(blob: Blob) {
  const blobUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = blobUrl;
  downloadLink.download = "recording.wav";
  downloadLink.click();
  URL.revokeObjectURL(blobUrl);
}

// TODO: make this function inference in a vague way
export async function AudioModules(data: Blob, ModelParameters: Object) /*: Promise<ResponseData>*/ {}

export async function nmtModule(prevResponse: ResponseData, language: LANGUAGES, asrModel: ASR): Promise<ResponseData> {
  const apiURL = "https://dev.speech-voxreality.maggioli-research.gr/" + ASR_MODULES[asrModel];
  const formData = new FormData();
  formData.append("audio_files", prevResponse.data!.file!, "recording.wav");

  try {
    const response = await fetch(apiURL + "?source_language=" + language, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw { status: { code: ASR_CODES.ERROR_RESPONSE, text: ASR_TEXT[ASR_CODES.ERROR_RESPONSE] } };
    }

    const data = await response.json();
    const responseText: string = data.transcriptions[0];

    return {
      status: { code: ASR_CODES.SUCCESSFUL, text: ASR_TEXT[ASR_CODES.SUCCESSFUL] },
      data: { text_en: responseText }
    };
  } catch (error) {
    throw { status: { code: ASR_CODES.ERROR_FETCH, text: ASR_TEXT[ASR_CODES.ERROR_FETCH] } };
  }
}

export function developingRouter() {
  const randomNumber = 0;

  if (randomNumber === 0) {
    const destNodeIndex = Math.floor(Math.random() * sceneGraph.nodeCount);
    const startNodeIndex = sceneGraph.GetClosestIndex(virtualAgent.AvatarPos());

    return {
      status: { code: 0, text: "successful" },
      data: {
        task_code: TASK.NAV,
        task_descript: TASK_DESCRIPT[TASK.NAV],
        start: startNodeIndex,
        dest: destNodeIndex
      }
    };
  } else if (randomNumber < 2) {
    return {
      status: { code: 0, text: "successful" },
      data: {
        task_code: TASK.SPATIAL,
        task_descript: TASK_DESCRIPT[TASK.SPATIAL]
      }
    };
  } else {
    throw {
      status: { code: 1, text: "could not find task" }
    };
  }
}

export async function routerModule(prevResponse: ResponseData): Promise<ResponseData> {
  // const randomNumber = Math.floor(Math.random() * 4);
  const randomNumber = 0;

  if (randomNumber === 0) {
    const destNodeIndex = Math.floor(Math.random() * sceneGraph.nodeCount);
    const startNodeIndex = sceneGraph.GetClosestIndex(virtualAgent.AvatarPos());

    return {
      status: { code: 0, text: "successful" },
      data: {
        text_en: prevResponse.data?.text_en!,
        task_code: TASK.NAV,
        task_descript: TASK_DESCRIPT[TASK.NAV],
        start: startNodeIndex,
        dest: destNodeIndex
      }
    };
  } else if (randomNumber < 2) {
    return {
      status: { code: 0, text: "successful" },
      data: {
        text_en: prevResponse.data?.text_en!,
        task_code: TASK.SPATIAL,
        task_descript: TASK_DESCRIPT[TASK.SPATIAL]
      }
    };
  } else {
    throw {
      status: { code: 1, text: "could not find task" }
    };
  }
}

export async function vlModule(
  pov: Blob,
  vlModule: VL,
  prevResponse?: ResponseData,
  depthPov?: Blob
): Promise<ResponseData> {
  const apiURL = VL_MODULES[vlModule];
  const formData = new FormData();
  formData.append("file", pov, "camera_pov.png");

  try {
    const response = await fetch(apiURL, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw { status: { code: VL_CODES.ERROR_RESPONSE, text: VL_TEXT[VL_CODES.ERROR_RESPONSE] } };
    }

    const data = await response.json();

    return {
      status: { code: VL_CODES.SUCCESSFUL, text: VL_TEXT[VL_CODES.SUCCESSFUL] },
      data: { descript: data }
    };
  } catch (error) {
    throw { status: { code: VL_CODES.ERROR_FETCH, text: VL_TEXT[VL_CODES.ERROR_FETCH] } };
  }
}
