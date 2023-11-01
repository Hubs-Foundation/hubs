import { string } from "prop-types";
import { Object3D, PerspectiveCamera, WebGLRenderer } from "three";
import {
  LANGUAGES,
  ResponseData,
  RECORDER_CODES,
  RECORDER_TEXT,
  ASR_MODULES,
  ASR_CODES,
  ASR_TEXT,
  TASK,
  TASK_DESCRIPT,
  VL_MODULES,
  VL,
  VL_CODES,
  VL_TEXT,
  AUDIO_ENDPOINTS,
  COMPONENT_ENDPOINTS
} from "./component-types";
import { HubsWorld } from "../app";
import { sceneGraph } from "../bit-systems/routing-system";
import { virtualAgent } from "../bit-systems/agent-system";

let mediaRecorder: MediaRecorder | null = null;
let chunks: any[] = [];
export let isRecording = false;
let recordingPromise: Promise<any>;

//TODO:: automate the query parameters
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
export async function AudioModules(
  endPoint: COMPONENT_ENDPOINTS,
  data: Blob,
  parameters: Record<string, any>
): Promise<ResponseData> {
  const formData = new FormData();
  formData.append("audio_files", data, "recording.wav");
  const queryString = Object.keys(parameters)
    .map(key => `${key}=${parameters[key]}`)
    .join("&");

  try {
    const response = await fetch(endPoint + `?${queryString}`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw { status: { code: ASR_CODES.ERROR_RESPONSE, text: ASR_TEXT[ASR_CODES.ERROR_RESPONSE] } };
    }

    const data = await response.json();

    return {
      status: { code: ASR_CODES.SUCCESSFUL, text: ASR_TEXT[ASR_CODES.SUCCESSFUL] },
      data: data
    };
  } catch (error) {
    throw { status: { code: ASR_CODES.ERROR_FETCH, text: ASR_TEXT[ASR_CODES.ERROR_FETCH] } };
  }
}

export function developingRouter() {
  const randomNumber = 0;

  if (randomNumber === 0) {
    const destNodeIndex = Math.floor(Math.random() * sceneGraph.nodeCount!);
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

export async function intentionModule(prevResponse: ResponseData): Promise<ResponseData> {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  const data = { user_query: prevResponse.data?.transcriptions![0] };

  try {
    const response = await fetch(COMPONENT_ENDPOINTS.INTENTION, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw { status: { code: ASR_CODES.ERROR_RESPONSE, text: ASR_TEXT[ASR_CODES.ERROR_RESPONSE] } };
    }

    const responseData = await response.json();

    return {
      status: { code: ASR_CODES.SUCCESSFUL, text: ASR_TEXT[ASR_CODES.SUCCESSFUL] },
      data: responseData
    };
  } catch (error) {
    throw { status: { code: ASR_CODES.ERROR_FETCH, text: ASR_TEXT[ASR_CODES.ERROR_FETCH] } };
  }
}

export async function knowledgeModule(userQuery: string, mozillaInput: string): Promise<ResponseData> {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  const data = { user_query: { user_query: userQuery }, mozilla_input: { mozilla_input: mozillaInput } };

  try {
    const response = await fetch(COMPONENT_ENDPOINTS.TASK_RESPONSE, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw { status: { code: ASR_CODES.ERROR_RESPONSE, text: ASR_TEXT[ASR_CODES.ERROR_RESPONSE] } };
    }

    const responseData = await response.json();

    return {
      status: { code: ASR_CODES.SUCCESSFUL, text: ASR_TEXT[ASR_CODES.SUCCESSFUL] },
      data: responseData
    };
  } catch (error) {
    throw { status: { code: ASR_CODES.ERROR_FETCH, text: ASR_TEXT[ASR_CODES.ERROR_FETCH] } };
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
