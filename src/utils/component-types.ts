export enum COMPONENT_ENDPOINTS {
  TRANSLATE_AUDIO = "https://dev.speech-voxreality.maggioli-research.gr/translate_audio",
  TRANSLATE_TEXT = "https://dev.speech-voxreality.maggioli-research.gr/translate_text",
  TRANSCRIBE_AUDIO_FILES = "https://dev.speech-voxreality.maggioli-research.gr/transcribe_audio_files",
  TRANSLATE_AUDIO_FILES = "https://dev.speech-voxreality.maggioli-research.gr/translate_audio_files",
  LXMERT = "https://dev.voxreality.maggioli-research.gr/lxmert/",
  GPT = "https://dev.gpt-voxreality.maggioli-research.gr/cap_gpt2/",
  INTENTION = "https://dev.conference-agent-voxreality.lab.synelixis.com/intent_dest/",
  TASK_RESPONSE = "https://dev.conference-agent-voxreality.lab.synelixis.com/response/"
}

export enum RECORDER_CODES {
  SUCCESSFUL,
  ERROR,
  STOP
}
export const RECORDER_TEXT: Record<RECORDER_CODES, string> = {
  [RECORDER_CODES.SUCCESSFUL]: "successful",
  [RECORDER_CODES.ERROR]: "media recorder error",
  [RECORDER_CODES.STOP]: "recording stopped"
};

export enum LANGUAGES {
  ENGLISH = "en",
  GREEK = "el",
  SPANISH = "es",
  ITALIAN = "it",
  DUTCH = "nl",
  GERMAN = "de"
}

export interface ResponseData {
  status: {
    code: number;
    text: string;
  };
  data?: {
    file?: Blob;
    text_init?: string;
    text_en?: string;
    task_descript?: string;
    start?: number;
    dest?: number;
    descript?: any;
    transcriptions?: string[];
    translations?: string[];
  };
}

export enum COMPONENT_CODES {
  Successful,
  FetchError,
  MediaRecorderError,
  RecordingStopped,
  NmtResponseError,
  UknownTask,
  UnknownDest
}

export const CODE_DESCRIPTIONS: Record<COMPONENT_CODES, string> = {
  [COMPONENT_CODES.Successful]: "Successfull",
  [COMPONENT_CODES.FetchError]: "Fetch fail",
  [COMPONENT_CODES.MediaRecorderError]: "Media Recorder Error",
  [COMPONENT_CODES.RecordingStopped]: "Recording Stopped",
  [COMPONENT_CODES.NmtResponseError]: "Error with the response of the NMT module",
  [COMPONENT_CODES.UknownTask]: "Uknown Task",
  [COMPONENT_CODES.UnknownDest]: "Uknown Destination"
};
