import { FlagPanelManager, Interacted } from "../bit-components";
import { getMediaStream } from "../components/avatar-audio-source";
import { paths } from "../systems/userinput/paths";
import { audioModules } from "../utils/asr-adapter";
import { COMPONENT_ENDPOINTS } from "../utils/component-types";
import { UpdateTextSystem } from "./agent-slideshow-system";
import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { virtualAgent } from "./agent-system";
import { loadTexture } from "../utils/load-texture";
import { textureLoader } from "../utils/media-utils";
import { selectMaterial, normalMaterial, HUDLangPanel } from "../prefabs/hud-lang-panel";
import { renderAsEntity } from "../utils/jsx-entity";

const panelManagerQuery = defineQuery([FlagPanelManager]);
const enterpanelManagerQuery = enterQuery(panelManagerQuery);
const exitpanelManagerQuery = exitQuery(panelManagerQuery);

const languageCodes = {
  greek: "el",
  english: "en",
  spanish: "es",
  italian: "it",
  dutch: "du",
  german: "de"
};

class objElement {
  constructor() {
    this.eid = null;
    this.obj = null;
  }
  update(eid) {
    this.eid = eid;
    this.obj = APP.world.eid2obj.get(eid);
  }
}

export class LanguagePanel {
  constructor() {
    this.initialized = false;
    this.panel = new objElement();
    this.flagButtons = {
      italian: new objElement(),
      spanish: new objElement(),
      dutch: new objElement(),
      german: new objElement(),
      greek: new objElement(),
      english: new objElement()
    };
    this.Setup = this.Setup.bind(this);
    this.Remove = this.Remove.bind(this);
  }

  Init() {
    const langToggle = () => {
      if (!APP.scene.is("panel")) {
        this.Instantiate();
      } else {
        this.Remove();
      }
    };

    if (this.initialized) {
      APP.scene.removeEventListener("lang-toggle", langToggle);
      this.initialized = false;
    }

    APP.scene.addEventListener("lang-toggle", langToggle);
  }

  Instantiate() {
    const eid = renderAsEntity(APP.world, HUDLangPanel());
    const obj = APP.world.eid2obj.get(eid);
    APP.world.scene.add(obj);
    APP.scene.addState("panel");
  }

  Remove() {
    console.log(this.panel.obj.parent);
    APP.scene.remove(this.panel.obj.parent);
    Object.values(this.flagButtons).forEach(button => {
      APP.scene.remove(button);
    });

    removeEntity(APP.world, this.panel.eid);

    APP.scene.removeState("panel");
  }

  Setup(panelEid) {
    this.panel.update(panelEid);
    const refs = {
      german: FlagPanelManager.deRef[panelEid],
      dutch: FlagPanelManager.duRef[panelEid],
      spanish: FlagPanelManager.esRef[panelEid],
      italian: FlagPanelManager.itRef[panelEid],
      greek: FlagPanelManager.elRef[panelEid],
      english: FlagPanelManager.enRef[panelEid]
    };

    Object.keys(refs).forEach(key => {
      this.flagButtons[key].update(refs[key]);
    });

    this.Update();
  }

  Update() {
    try {
      Object.keys(this.flagButtons).forEach(key => {
        this.flagButtons[key].obj.material = normalMaterial.clone();
      });
      if (subtitleSystem.targetLanguage) {
        this.flagObjs[this.targetLanguage].obj.material = selectMaterial.clone();
      }
    } catch (e) {
      console.error(e);
    }
  }

  Cleanup(eid) {
    if (this.panel.eid === eid) this.panel.update(null);
    Object.keys(this.flagButtons).forEach(key => {
      this.flagButtons[key].update(null);
    });
  }

  Interactions(world) {
    Object.keys(this.flagButtons).forEach(key => {
      if (hasComponent(world, Interacted, this.flagButtons[key].eid)) {
        if (subtitleSystem.targetLanguage === key) subtitleSystem.updateLanguage("");
        else subtitleSystem.updateLanguage(key);
      }
    });
  }
}

export class SubtitleSystem {
  constructor() {
    this.target;
    this.VRmode;
    this.targetLanguage;
    this.scene;
    this.audioContext;
    this.analyser;
    this.minSilenceDuration;
    this.sourceNode;
    this.dataArray;
    this.mediaRecorder;
    this.animationFrameID;
    this.onLanguageAvailable = this.onLanguageAvailable.bind(this);
  }

  Init() {
    this.targetLanguage = null;
    this.updateLanguage(window.APP.store.state.profile.language);
    this.sourceLanguage = null;
    this.target = null;
    this.scene = APP.scene;
    this.VRmode = this.scene.is("vr-mode");
    this.cleanup = false;
    this.counter = 0;
    this.scene.addEventListener("language_available", this.onLanguageAvailable);
  }

  onLanguageAvailable(event) {
    this.updateLanguage(event.detail.language);
  }

  updateLanguage(lang) {
    this.targetLanguage = lang;
    // languagePanel.Update();
    if (!!this.targetLanguage) {
      window.APP.store.update({ profile: { language: this.targetLanguage } });
    } else {
      window.APP.store.update({ profile: { language: "" } });
    }
    APP.scene.emit("language_updated", { language: this.targetLanguage });
  }

  SetSourceLanguage(_lang) {
    this.sourceLanguage = _lang;
    console.log("Translate from:", this.sourceLanguage, this.targetLanguage);
  }

  SelectTarget(_target) {
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
}

export function FlagPanelSystem(world) {
  enterpanelManagerQuery(world).forEach(panelEid => {
    languagePanel.Setup(panelEid);
  });
  exitpanelManagerQuery(world).forEach(panelEid => {
    languagePanel.Cleanup(panelEid);
  });
  panelManagerQuery(world).forEach(panelEid => {
    languagePanel.Interactions(world);
  });
}

export const subtitleSystem = new SubtitleSystem();
export const languagePanel = new LanguagePanel();
