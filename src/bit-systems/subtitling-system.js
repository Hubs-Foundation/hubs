import { FlagPanelManager } from "../bit-components";
import { getMediaStream } from "../components/avatar-audio-source";
import { paths } from "../systems/userinput/paths";
import { audioModules } from "../utils/asr-adapter";
import { COMPONENT_ENDPOINTS } from "../utils/component-types";
import { UpdateTextSystem } from "./agent-slideshow-system";
import { addComponent, defineQuery, enterQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { virtualAgent } from "./agent-system";

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
    this.onLanguageUpdate = this.onLanguageUpdate.bind(this);
    this.flagObjs = { it: null, es: null, du: null, de: null, el: null };
  }

  Init() {
    this.myLanguage = "en";
    this.target = null;
    this.targetLanguage = null;
    this.scene = APP.scene;
    this.VRmode = this.scene.is("vr-mode");
    this.initialized = true;
    this.cleanup = false;
    this.counter = 0;
    this.scene.addEventListener("language_updated", this.onLanguageUpdate);
  }

  onLanguageUpdate(event) {
    this.targetLanguage = event.detail.language;
    if (this.FlagManagerID) {
      Object.keys(this.flagObjs).forEach(key => {
        console.log(key);
      });
    }
  }

  SelectTarget(_target) {
    //TODO:: Fix error when leaving unexpectidly
    if (this.hasTarget()) this.StopTranslating();
    if (this.target === _target) this.target = null;
    else this.target = _target;
    APP.scene.emit("translation-target-updated", { owner: this.target });
    if (this.hasTarget()) {
      APP.scene.emit("translation-available", { text: "The audio translation will be displayed here!" });
      // this.DemoTranslating();
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

  DemoTranslating() {
    let text;
    switch (this.counter % 4) {
      case 0:
        text = "Here is new text for my translation panel";
        break;
      case 1:
        text = "My name is Amalia Antonopoulou and I represent the beautiful island of Greece";
        break;
      case 2:
        text = "Lucky that my breasts are small and humble so you don't confuse them with mountains";
        break;
      case 3:
        text = "Hello everybody";
        break;
    }

    this.counter++;
    APP.scene.emit("translation-available", { text: text });
  }

  StartTranslating() {
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

          const recordingTime = performance.now() - recordingStartTime;
          if (recordingTime > maxRecordingDuration) {
            restartRec();
          }

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
            inference && chunks.length > 0 && recordingBlob.size > 0 && !!this.targetLanguage && !!this.myLanguage;
          chunks.length = 0;

          if (inference) {
            // this.saveAudio(recordingBlob);
            audioModules(COMPONENT_ENDPOINTS.TRANSLATE_AUDIO_FILES, recordingBlob, {
              source_language: this.myLanguage,
              target_language: this.targetLanguage,
              return_transcription: "true"
            })
              .then(translateRespone => {
                // console.log(translateRespone);
                APP.scene.emit("translation-available", { text: translateRespone.data.translations[0] });
                console.log("i emit translation available");
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

  SetLanguage(_language) {
    this.myLanguage = _language;
  }
}

const panelManagerQuery = defineQuery([FlagPanelManager]);
const enterpanelManagerQuery = enterQuery(panelManagerQuery);
const exitpanelManagerQuery = exitQuery(panelManagerQuery);

export function FlagPanelSystem(world) {
  enterpanelManagerQuery(world).forEach(managerEid => {
    subtitleSystem.FlagManagerID = managerEid;
    subtitleSystem.flagObjs.de = world.eid2obj.get(FlagPanelManager.deRef[managerEid]);
    subtitleSystem.flagObjs.du = world.eid2obj.get(FlagPanelManager.duRef[managerEid]);
    subtitleSystem.flagObjs.es = world.eid2obj.get(FlagPanelManager.esRef[managerEid]);
    subtitleSystem.flagObjs.it = world.eid2obj.get(FlagPanelManager.itRef[managerEid]);
    subtitleSystem.flagObjs.el = world.eid2obj.get(FlagPanelManager.elRef[managerEid]);
  });
  exitpanelManagerQuery(world).forEach(managerEid => {
    if (subtitleSystem.FlagManagerID === managerEid) subtitleSystem.FlagManagerID = null;
  });
}

export const subtitleSystem = new SubtitleSystem();
