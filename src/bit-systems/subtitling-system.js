import { FlagPanelManager, Interacted } from "../bit-components";
import { getMediaStream } from "../components/avatar-audio-source";
import { paths } from "../systems/userinput/paths";
import { audioModules } from "../utils/asr-adapter";
import { COMPONENT_ENDPOINTS } from "../utils/component-types";
import { UpdateTextSystem } from "./agent-slideshow-system";
import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { logger, virtualAgent } from "./agent-system";
import { loadTexture } from "../utils/load-texture";
import { textureLoader } from "../utils/media-utils";
import { selectMaterial, normalMaterial, HUDLangPanel } from "../prefabs/hud-lang-panel";
import { renderAsEntity } from "../utils/jsx-entity";
import { Logger } from "../utils/logging_systems";

const panelManagerQuery = defineQuery([FlagPanelManager]);
const enterpanelManagerQuery = enterQuery(panelManagerQuery);
const exitpanelManagerQuery = exitQuery(panelManagerQuery);

export const languageCodes = {
  greek: "el",
  english: "en",
  spanish: "es",
  italian: "it",
  dutch: "nl",
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
    this.Update = this.Update.bind(this);

    this.onLanguageUpdated = this.onLanguageUpdated.bind(this);
    this.onClear = this.onClear.bind(this);
    this.onToggle = this.onToggle.bind(this);
  }

  Init(reset) {
    if (reset) return;

    APP.scene.addEventListener("lang-toggle", this.onToggle);
    APP.scene.addEventListener("clear-scene", this.onClear);
  }

  Instantiate() {
    const eid = renderAsEntity(APP.world, HUDLangPanel());
    const obj = APP.world.eid2obj.get(eid);
    APP.world.scene.add(obj);
    APP.scene.addState("panel");
  }

  Remove() {
    APP.world.scene.remove(this.panel.obj.parent);
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

    this.Update(subtitleSystem.mylanguage);
    APP.scene.addEventListener("language_updated", this.onLanguageUpdated);
  }

  Update(language) {
    try {
      Object.keys(this.flagButtons).forEach(key => {
        this.flagButtons[key].obj.material = normalMaterial.clone();
      });
      if (language) {
        this.flagButtons[language].obj.material = selectMaterial.clone();
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
    APP.scene.removeEventListener("language_updated", this.onLanguageUpdated);
  }

  Interactions(world) {
    Object.keys(this.flagButtons).forEach(key => {
      if (hasComponent(world, Interacted, this.flagButtons[key].eid)) {
        if (subtitleSystem.mylanguage === key) subtitleSystem.updateMyLanguage("");
        else subtitleSystem.updateMyLanguage(key);
      }
    });
  }

  onLanguageUpdated(event) {
    this.Update(event.detail.language);
  }

  onClear() {
    if (APP.scene.is("panel")) {
      this.Remove();
    }
  }

  onToggle() {
    if (!APP.scene.is("panel")) {
      APP.scene.emit("clear-scene");
      this.Instantiate();
    } else {
      this.Remove();
    }
  }
}

export class SubtitleSystem {
  constructor() {
    this.target;
    this.VRmode;
    this.mylanguage;
    this.scene;
    this.audioContext;
    this.analyser;
    this.minSilenceDuration;
    this.sourceNode;
    this.dataArray;
    this.mediaRecorder;
    this.animationFrameID;
    this.micStatus;
    this.isRecording;
    this.onLanguageAvailable = this.onLanguageAvailable.bind(this);
    this.onTranslationUpdatesAvailable = this.onTranslationUpdatesAvailable.bind(this);
    this.setMicStatus = this.setMicStatus.bind(this);
  }

  Init(reset) {
    if (reset) {
      this.target = null;
      this.counter = 0;
      return;
    }

    this.updateMyLanguage("");
    this.targetLanguage = null;
    this.targetMicStatus = null;
    this.target = null;
    this.scene = APP.scene;
    this.VRmode = this.scene.is("vr-mode");
    this.cleanup = false;
    this.counter = 0;
    this.isRecording = false;

    this.scene.addEventListener("language_available", this.onLanguageAvailable);
    this.scene.addEventListener("translation_updates_available", this.onTranslationUpdatesAvailable);
    APP.dialog.on("mic-state-changed", this.setMicStatus);
  }

  setMicStatus() {
    this.micStatus = APP.mediaDevicesManager.isMicEnabled;
    window.APP.store.update({ profile: { micStatus: !!this.micStatus } });
    console.log(window.APP.store.state.profile);
  }

  onTranslationUpdatesAvailable(event) {
    if (event.detail.type === "target") this.UpdateTarget(event.detail);
    else if (event.detail.type === "properties") this.updateTargetProperties(event.detail);
    else if (event.detail.type === "stop") {
      this.stopTranslating();
      console.log("Event listened. translation stopped");
    }
    this.TranslateCheck();
  }

  stopTranslating() {
    this.StopRecording();
    this.target = null;
    this.targetLanguage = null;
    this.targetMicStatus = null;
    APP.scene.emit("translation-stopped");
  }

  UpdateTarget(newTargetDetails) {
    this.StopRecording();
    this.target = newTargetDetails.target;
    this.targetLanguage = newTargetDetails.language;
    this.targetMicStatus = newTargetDetails.micStatus;
    const announcedProperties = { owner: this.target, language: this.targetLanguage, micStatus: this.micStatus };
    APP.scene.emit("translation-target-updated", announcedProperties);
  }

  updateTargetProperties(newProperties) {
    const announcedProperties = { language: newProperties.language, micStatus: newProperties.micStatus };

    if (this.targetLanguage !== newProperties.language) {
      APP.scene.emit("translation_target_properties_updated", announcedProperties);
      this.targetLanguage = newProperties.language;
    }

    if (this.targetMicStatus !== newProperties.micStatus) {
      this.targetMicStatus = newProperties.micStatus;
    }
  }

  TranslateCheck() {
    if (this.targetLanguage && this.targetMicStatus && !this.isRecording) {
      this.StartTranslating();
    } else if (!this.micStatus && this.isRecording) {
      this.StopRecording();
    }
  }

  async StartTranslating() {
    console.log("Translate from:", this.targetLanguage, this.mylanguage);

    const stream = await this.GetTargetStream(this.target);
    this.mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    this.mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };

    this.mediaRecorder.onstop = async () => {
      const recordingBlob = new Blob(chunks, { type: "audio/wav" });
      const inference = chunks.length > 0 && recordingBlob.size > 0 && this.hasMyLanguage && this.hasTargetLanguage;
      chunks.length = 0;

      if (inference) {
        // this.saveAudio(recordingBlob);

        logger.action = "translation";

        const inferenceParams = {
          source_language: languageCodes[this.targetLanguage],
          target_language: languageCodes[this.mylanguage],
          return_transcription: "true"
        };

        logger.audioTranslation.start = new Date();

        const translateRespone = await audioModules(
          COMPONENT_ENDPOINTS.TRANSLATE_AUDIO_FILES,
          recordingBlob,
          inferenceParams
        );

        logger.audioTranslation.finish = new Date();
        logger.audioTranslation.input = {
          file: "audio_file",
          source_language: inferenceParams.source_language,
          target_language: inferenceParams.target_language
        };
        logger.audioTranslation.output = {
          translation: translateRespone.data.translations[0],
          transcription: translateRespone.data.transcriptions[0]
        };

        APP.scene.emit("translation-available", { text: translateRespone.data.translations[0] });
        UpdateTextSystem(APP.world, translateRespone.data.translations[0]);
      }

      this.isRecording = false;
    };

    this.mediaRecorder.onerror = event => {
      reject({
        status: { code: RECORDER_CODES.ERROR, text: RECORDER_TEXT[RECORDER_CODES.ERROR] }
      });
      console.log(event);
    };

    this.mediaRecorder.start();
    this.isRecording = true;
  }

  StopRecording() {
    if (this.mediaRecorder && this.isRecording) this.mediaRecorder.stop();
  }

  onLanguageAvailable(event) {
    this.updateMyLanguage(event.detail.language);
  }

  updateMyLanguage(newLang) {
    this.mylanguage = newLang;
    if (this.hasMyLanguage) {
      window.APP.store.update({ profile: { language: this.mylanguage } });
    } else {
      window.APP.store.update({ profile: { language: "" } });
    }
    APP.scene.emit("language_updated", { language: this.mylanguage });
    console.log("language_updated", { language: this.mylanguage });
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
    if (!this.hasTarget) return;

    const stream = await APP.dialog.getMediaStream(peerID).catch(e => {
      console.error(INFO_INIT_FAILED, `Error getting media stream for ${peerID}`, e);
    });
    if (!stream) {
      return null;
    }
    return stream;
  }

  get hasTarget() {
    return !!this.target;
  }

  get hasMyLanguage() {
    return !!this.mylanguage;
  }

  get hasTargetLanguage() {
    return !!this.targetLanguage;
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
