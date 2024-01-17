import { FlagPanelManager, Interacted } from "../bit-components";
import { getMediaStream } from "../components/avatar-audio-source";
import { paths } from "../systems/userinput/paths";
import { audioModules } from "../utils/asr-adapter";
import { COMPONENT_ENDPOINTS } from "../utils/component-types";
import { UpdateTextSystem } from "./agent-slideshow-system";
import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { objElement, virtualAgent } from "./agent-system";
import { loadTexture } from "../utils/load-texture";
import { textureLoader } from "../utils/media-utils";
import { selectMaterial, normalMaterial } from "../prefabs/hud-lang-panel";

export class SubtitleSystem {
  constructor() {
    this.mylanguage;
    this.target;
    this.VRmode;
    this.targetLanguage;
    this.scene;
    this.initialized;
    this.audioContext;
    this.analyser;
    this.minSilenceDuration;
    this.sourceNode;
    this.dataArray;
    this.mediaRecorder;
    this.animationFrameID;
    this.FlagManagerID;
    this.onLanguageAvailable = this.onLanguageAvailable.bind(this);
    this.flagObjs = { italian: null, spanish: null, dutch: null, german: null, greek: null, english: null };
  }

  Init() {
    this.targetLanguage = null;
    this.updateLanguage(window.APP.store.state.profile.language);
    this.sourceLanguage = null;
    this.target = null;
    this.scene = APP.scene;
    this.VRmode = this.scene.is("vr-mode");
    this.initialized = true;
    this.cleanup = false;
    this.counter = 0;
    this.scene.addEventListener("language_available", this.onLanguageAvailable);
  }

  ResetPanel() {
    if (!this.FlagManagerID) return;

    try {
      Object.keys(this.flagObjs).forEach(key => {
        this.flagObjs[key].obj.material = normalMaterial.clone();
      });
      if (this.targetLanguage) {
        this.flagObjs[this.targetLanguage].obj.material = selectMaterial.clone();
      }
    } catch (e) {
      console.error(e);
    }
  }

  onLanguageAvailable(event) {
    this.updateLanguage(event.detail.language);
  }

  updateLanguage(lang) {
    this.targetLanguage = lang;
    this.ResetPanel();
    if (!!this.targetLanguage) {
      window.APP.store.update({ profile: { language: this.targetLanguage } });
    } else {
      window.APP.store.update({ profile: { language: "" } });
    }

    // console.log(window.APP.store.state.profile);
    APP.scene.emit("language_updated", { language: this.targetLanguage });
  }

  SetSourceLanguage(_lang) {
    this.sourceLanguage = _lang;
    console.log("Translate from:", this.sourceLanguage, this.targetLanguage);
  }

  SelectTarget(_target) {
    //TODO:: Fix error when leaving unexpectidly
    if (this.hasTarget()) this.StopTranslating();
    if (this.target === _target) this.target = null;
    else this.target = _target;
    APP.scene.emit("translation-target-updated", { owner: this.target });

    if (this.hasTarget()) {
      APP.scene.emit("translation-available", { text: "The audio translation will be displayed here!" });
      this.StartTranslating();
    }
  }

  StopTranslating() {
    // Stop procedures
    if (this.mediaRecorder && this.isRecording) this.mediaRecorder.stop();
    if (this.sourceNode) this.sourceNode.disconnect();
    if (this.audioContext) this.audioContext.close().then();
    if (this.animationFrameID) cancelAnimationFrame(this.animationFrameID);

    // Cleanup
    this.mediaRecorder = null;
    this.audioContext = null;
    this.analyser = null;
    this.animationFrameID = null;
  }

  StartTranslating() {
    console.log("Translate from:", this.sourceLanguage, this.targetLanguage);
    this.GetTargetStream(this.target)
      .then(stream => {
        console.log(stream);

        this.audioContext = new window.AudioContext();
        this.mediaRecorder = new MediaRecorder(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.sourceNode = this.audioContext.createMediaStreamSource(stream);
        this.sourceNode.connect(this.analyser);
        this.analyser.fftSize = 256;

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const silenceThreshold = 0.1;
        const minSilenceDuration = 1000;
        const maxRecordingDuration = 3000;
        const chunks = [];

        let isSilent = false;
        let silenceStartTime = 0;
        let recordingStartTime = 0;
        let isRecording = false;
        let wasEvernotSilent = false;
        let inference = false;

        const restartRec = () => {
          inference = wasEvernotSilent;
          this.mediaRecorder.stop();
          isRecording = false;
          isSilent = false;
          wasEvernotSilent = false;
        };

        const detectSilence = () => {
          this.analyser.getByteFrequencyData(dataArray);
          const amplitude = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length / 255;

          if (amplitude < silenceThreshold) {
            if (!isSilent) {
              isSilent = true;
              silenceStartTime = performance.now();
            } else {
              const currentTime = performance.now();
              const silenceDuration = currentTime - silenceStartTime;

              if (silenceDuration >= minSilenceDuration && isRecording) {
                restartRec();
              }
            }
          } else {
            isSilent = false;
            wasEvernotSilent = true;
          }

          // Don't care about the duration
          // const recordingTime = performance.now() - recordingStartTime;
          // if (recordingTime > maxRecordingDuration) {
          //   restartRec();
          // }

          this.animationFrameID = requestAnimationFrame(detectSilence);
        };

        detectSilence();

        this.mediaRecorder.ondataavailable = function (e) {
          chunks.push(e.data);
        };

        this.mediaRecorder.onstart = () => {
          recordingStartTime = performance.now();
        };

        this.mediaRecorder.onstop = () => {
          const recordingBlob = new Blob(chunks, { type: "audio/wav" });
          inference =
            inference && chunks.length > 0 && recordingBlob.size > 0 && !!this.targetLanguage && !!this.sourceLanguage;
          chunks.length = 0;

          if (inference) {
            // this.saveAudio(recordingBlob);
            audioModules(COMPONENT_ENDPOINTS.TRANSLATE_AUDIO_FILES, recordingBlob, {
              source_language: languageCodes[this.sourceLanguage],
              target_language: languageCodes[this.targetLanguage],
              return_transcription: "true"
            })
              .then(translateRespone => {
                // console.log(translateRespone);
                APP.scene.emit("translation-available", { text: translateRespone.data.translations[0] });

                UpdateTextSystem(APP.world, translateRespone.data.translations[0]);
              })
              .catch(error => {
                console.error(error);
              });
          }

          this.mediaRecorder.start();
          isRecording = true;
        };

        this.mediaRecorder.onerror = event => {
          reject({
            status: { code: RECORDER_CODES.ERROR, text: RECORDER_TEXT[RECORDER_CODES.ERROR] }
          });
          console.log(event);
        };

        this.mediaRecorder.start();
        isRecording = true;
      })
      .catch(e => {
        console.error(e);
      });
  }

  saveAudio(blob) {
    const blobUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = blobUrl;
    downloadLink.download = "recording.wav";
    downloadLink.click();
    URL.revokeObjectURL(blobUrl);
  }

  async GetTargetStream(peerID) {
    if (!this.hasTarget()) return;

    const stream = await APP.dialog.getMediaStream(peerID).catch(e => {
      console.error(INFO_INIT_FAILED, `Error getting media stream for ${peerID}`, e);
    });
    if (!stream) {
      return null;
    }
    return stream;
  }

  hasTarget() {
    return !!this.target;
  }

  hasTargetLanguage() {
    return !!this.targetLanguage;
  }

  SetTargetLanguage(_language) {
    this.targetLanguage = _language;
    window.APP.store.update({ profile: { language: _language } });
    console.log(window.APP.store);
  }

  checkPanel(world) {
    if (hasComponent(world, Interacted, this.flagObjs.german.eid)) {
      if (this.targetLanguage === "german") this.updateLanguage("");
      else this.updateLanguage("german");
    }
    if (hasComponent(world, Interacted, this.flagObjs.dutch.eid)) {
      if (this.targetLanguage === "dutch") this.updateLanguage("");
      else this.updateLanguage("dutch");
    }
    if (hasComponent(world, Interacted, this.flagObjs.italian.eid)) {
      if (this.targetLanguage === "italian") this.updateLanguage("");
      else this.updateLanguage("italian");
    }
    if (hasComponent(world, Interacted, this.flagObjs.spanish.eid)) {
      if (this.targetLanguage === "spanish") this.updateLanguage("");
      else this.updateLanguage("spanish");
    }
    if (hasComponent(world, Interacted, this.flagObjs.greek.eid)) {
      if (this.targetLanguage === "greek") this.updateLanguage("");
      else this.updateLanguage("greek");
    }
    if (hasComponent(world, Interacted, this.flagObjs.english.eid)) {
      if (this.targetLanguage === "english") this.updateLanguage("");
      else this.updateLanguage("english");
    }
  }
}

const panelManagerQuery = defineQuery([FlagPanelManager]);
const enterpanelManagerQuery = enterQuery(panelManagerQuery);
const exitpanelManagerQuery = exitQuery(panelManagerQuery);

export function FlagPanelSystem(world) {
  enterpanelManagerQuery(world).forEach(managerEid => {
    subtitleSystem.FlagManagerID = managerEid;
    subtitleSystem.flagObjs.german = new objElement(FlagPanelManager.deRef[managerEid]);
    subtitleSystem.flagObjs.dutch = new objElement(FlagPanelManager.duRef[managerEid]);
    subtitleSystem.flagObjs.spanish = new objElement(FlagPanelManager.esRef[managerEid]);
    subtitleSystem.flagObjs.italian = new objElement(FlagPanelManager.itRef[managerEid]);
    subtitleSystem.flagObjs.greek = new objElement(FlagPanelManager.elRef[managerEid]);
    subtitleSystem.flagObjs.english = new objElement(FlagPanelManager.enRef[managerEid]);

    subtitleSystem.ResetPanel();
  });
  panelManagerQuery(world).forEach(eid => {
    subtitleSystem.checkPanel(world);
  });
  exitpanelManagerQuery(world).forEach(managerEid => {
    if (subtitleSystem.FlagManagerID === managerEid) subtitleSystem.FlagManagerID = null;

    Object.keys(subtitleSystem.flagObjs).forEach(key => {
      subtitleSystem.flagObjs[key] = null;
    });
  });
}

export const subtitleSystem = new SubtitleSystem();

const languageCodes = {
  greek: "el",
  english: "en",
  spanish: "es",
  italian: "it",
  dutch: "du",
  german: "de"
};
