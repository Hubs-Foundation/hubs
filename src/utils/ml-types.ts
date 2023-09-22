export enum AUDIO_ENDPOINTS {
  TRANSLATE_AUDIO = "https://dev.speech-voxreality.maggioli-research.gr/translate_audio",
  TRANSLATE_TEXT = "https://dev.speech-voxreality.maggioli-research.gr/translate_text",
  TRANSCRIBE_AUDIO_FILES = "https://dev.speech-voxreality.maggioli-research.gr/transcribe_audio_files",
  TRANSLATE_AUDIO_FILES = "https://dev.speech-voxreality.maggioli-research.gr/translate_audio_files"
}
export const ASR_MODULES: Record<AUDIO_ENDPOINTS, string> = {
  [AUDIO_ENDPOINTS.TRANSLATE_AUDIO]: "translate_audio",
  [AUDIO_ENDPOINTS.TRANSLATE_TEXT]: "translate_text",
  [AUDIO_ENDPOINTS.TRANSCRIBE_AUDIO_FILES]: "transcribe_audio_files",
  [AUDIO_ENDPOINTS.TRANSLATE_AUDIO_FILES]: "translate_audio_file"
};

export enum ASR_CODES {
  SUCCESSFUL,
  ERROR_RESPONSE,
  ERROR_FETCH
}
export const ASR_TEXT: Record<ASR_CODES, string> = {
  [ASR_CODES.SUCCESSFUL]: "successful",
  [ASR_CODES.ERROR_RESPONSE]: "response not ok",
  [ASR_CODES.ERROR_FETCH]: "fetch failed"
};

export enum VL {
  LXMERT,
  GPT
}
export const VL_MODULES: Record<VL, string> = {
  [VL.LXMERT]: "https://dev.voxreality.maggioli-research.gr/lxmert/",
  [VL.GPT]: "https://dev.gpt-voxreality.maggioli-research.gr/cap_gpt2/"
};

export enum VL_CODES {
  SUCCESSFUL,
  ERROR_RESPONSE,
  ERROR_FETCH
}
export const VL_TEXT: Record<VL_CODES, string> = {
  [VL_CODES.SUCCESSFUL]: "successful",
  [VL_CODES.ERROR_RESPONSE]: "response not ok",
  [VL_CODES.ERROR_FETCH]: "fetch failed"
};

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

export enum TASK {
  QA,
  NAV,
  PROGRAM,
  SPATIAL
}
export const TASK_DESCRIPT: Record<TASK, string> = {
  [TASK.QA]: "Question Answering",
  [TASK.NAV]: "Navigation",
  [TASK.PROGRAM]: "Event Program",
  [TASK.SPATIAL]: "Spatial Info"
};

export interface ResponseData {
  status: {
    code: number;
    text: string;
  };
  data?: {
    file?: Blob;
    text_init?: string;
    text_en?: string;
    task_code?: TASK;
    task_descript?: string;
    start?: number;
    dest?: number;
    descript?: any;
  };
}
