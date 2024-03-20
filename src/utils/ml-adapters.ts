import { virtualAgent } from "../bit-systems/agent-system";
import { ResponseData, COMPONENT_ENDPOINTS, COMPONENT_CODES, CODE_DESCRIPTIONS } from "./component-types";
import { SoundAnalyzer } from "./silence-detector";

let mediaRecorder: MediaRecorder | null = null;
let chunks: any[] = [];
export let isRecording = false;

export async function RecordQuestion(savefile: boolean): Promise<any> {
  return new Promise((resolve, reject) => {
    const audioTrack = APP.mediaDevicesManager!.audioTrack;
    const recordingTrack = audioTrack.clone();
    const recordingStream = new MediaStream([recordingTrack]);
    mediaRecorder = new MediaRecorder(recordingStream);
    audioTrack.enabled = false;

    const soundAnalyzer = new SoundAnalyzer({ stream: recordingStream });

    soundAnalyzer.on("start", () => {
      virtualAgent.isListening = true;
    });

    soundAnalyzer.on("stop", () => {
      virtualAgent.isListening = false;
    });

    soundAnalyzer.Start();

    mediaRecorder.ondataavailable = event => {
      chunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const recordingBlob = new Blob(chunks, { type: "audio/wav" });
      chunks.length = 0;
      audioTrack.enabled = true;
      recordingStream.removeTrack(recordingTrack);
      recordingTrack.stop();
      soundAnalyzer.Stop();
      if (savefile) saveAudio(recordingBlob);

      resolve({
        status: { code: COMPONENT_CODES.Successful, text: CODE_DESCRIPTIONS[COMPONENT_CODES.Successful] },
        data: { file: recordingBlob }
      });
    };

    mediaRecorder.onerror = event => {
      reject({
        status: {
          code: COMPONENT_CODES.MediaRecorderError,
          text: CODE_DESCRIPTIONS[COMPONENT_CODES.MediaRecorderError]
        }
      });
    };

    mediaRecorder.start();
    isRecording = true;
  });
}

export function stopRecording() {
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
export async function audioModules(
  endPoint: COMPONENT_ENDPOINTS,
  data: Blob,
  parameters: Record<string, any>,
  signal?: AbortSignal
): Promise<ResponseData> {
  const formData = new FormData();
  formData.append("audio_files", data, "recording.wav");
  const queryString = Object.keys(parameters)
    .map(key => `${key}=${parameters[key]}`)
    .join("&");

  try {
    const response = await fetch(endPoint + `?${queryString}`, {
      method: "POST",
      body: formData,
      signal: signal
    });

    const data = await response.json();

    return {
      status: { code: COMPONENT_CODES.Successful, text: CODE_DESCRIPTIONS[COMPONENT_CODES.Successful] },
      data: data
    };
  } catch (error) {
    throw { status: { code: COMPONENT_CODES.FetchError, text: CODE_DESCRIPTIONS[COMPONENT_CODES.FetchError] } };
  }
}

export async function textModule(
  endPoint: COMPONENT_ENDPOINTS,
  data: string,
  parameters: Record<string, any>
): Promise<ResponseData> {
  const queryString = Object.keys(parameters)
    .map(key => `${key}=${parameters[key]}`)
    .join("&");

  const requestBody = { text: data };

  try {
    const response = await fetch(endPoint + `?${queryString}`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const responseBody = await response.json();

    return {
      status: { code: COMPONENT_CODES.Successful, text: CODE_DESCRIPTIONS[COMPONENT_CODES.Successful] },
      data: responseBody
    };
  } catch (error) {
    throw { status: { code: COMPONENT_CODES.FetchError, text: CODE_DESCRIPTIONS[COMPONENT_CODES.FetchError] } };
  }
}

export async function intentionModule(englishTranscription: string): Promise<ResponseData> {
  const headers = { Accept: "application/json", "Content-Type": "application/json" };
  const data = { user_query: englishTranscription };

  try {
    const response = await fetch(COMPONENT_ENDPOINTS.INTENTION, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data)
    });

    const responseData = await response.json();

    return {
      status: { code: COMPONENT_CODES.Successful, text: CODE_DESCRIPTIONS[COMPONENT_CODES.Successful] },
      data: responseData
    };
  } catch (error) {
    throw { status: { code: COMPONENT_CODES.FetchError, text: CODE_DESCRIPTIONS[COMPONENT_CODES.FetchError] } };
  }
}

export async function dsResponseModule(userQuery: string, intent: string, mozillaInput: string): Promise<ResponseData> {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  const data = { user_query: userQuery, intent: intent, mozilla_input: mozillaInput };

  try {
    const response = await fetch(COMPONENT_ENDPOINTS.TASK_RESPONSE, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data)
    });

    const responseData = await response.json();

    return {
      status: { code: COMPONENT_CODES.Successful, text: CODE_DESCRIPTIONS[COMPONENT_CODES.Successful] },
      data: responseData
    };
  } catch (error) {
    throw { status: { code: COMPONENT_CODES.FetchError, text: CODE_DESCRIPTIONS[COMPONENT_CODES.FetchError] } };
  }
}

export async function vlModule(pov: Blob, vlModule: COMPONENT_ENDPOINTS): Promise<ResponseData> {
  const formData = new FormData();
  formData.append("file", pov, "camera_pov.png");

  try {
    const response = await fetch(vlModule, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    return {
      status: { code: COMPONENT_CODES.Successful, text: CODE_DESCRIPTIONS[COMPONENT_CODES.Successful] },
      data: { descript: data }
    };
  } catch (error) {
    throw { status: { code: COMPONENT_CODES.FetchError, text: CODE_DESCRIPTIONS[COMPONENT_CODES.FetchError] } };
  }
}
