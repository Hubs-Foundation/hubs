import { FlagPanelManager, Interacted } from "../bit-components";
import { getMediaStream } from "../components/avatar-audio-source";
import { paths } from "../systems/userinput/paths";
import { audioModules } from "../utils/ml-adapters";
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
    let closePanel = false;
    Object.keys(this.flagButtons).forEach(key => {
      if (hasComponent(world, Interacted, this.flagButtons[key].eid)) {
        closePanel = true;
        if (subtitleSystem.mylanguage === key) subtitleSystem.updateMyLanguage("");
        else subtitleSystem.updateMyLanguage(key);
      }
    });

    if (closePanel) APP.scene.emit("lang-toggle");
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
    this.mylanguage;
    this.targetLanguage;
    this.silenceCheckInterval;
    this.forcefail;
    this.onLanguageAvailable = this.onLanguageAvailable.bind(this);
    this.onTranslationUpdatesAvailable = this.onTranslationUpdatesAvailable.bind(this);
    this.InferenceAudio = this.InferenceAudio.bind(this);
  }

  Init(reset) {
    if (reset) {
      this.target = null;
      return;
    }

    this.updateMyLanguage("");
    this.targetLanguage = null;
    this.target = null;
    this.silenceCheckInterval = null;

    this.recordingAverage = [];
    this.inactiveAverage = [];
    this.forcefail = false;
    this.inferencing = false;

    APP.scene.addEventListener("language_available", this.onLanguageAvailable);
    APP.scene.addEventListener("translation_updates_available", this.onTranslationUpdatesAvailable);
  }

  ClearSilenceInterval() {
    clearInterval(this.silenceCheckInterval);
    this.silenceCheckInterval = null;
  }

  onTranslationUpdatesAvailable(event) {
    if (event.detail.type === "target") this.UpdateTarget(event.detail);
    else if (event.detail.type === "properties") this.updateTargetProperties(event.detail);
    else if (event.detail.type === "stop") this.stopTranslating();
  }

  statisticalAnalysis(arr) {
    // Creating the mean with Array.reduce
    let mean =
      arr.reduce((acc, curr) => {
        return acc + curr;
      }, 0) / arr.length;

    // Assigning (value - mean) ^ 2 to
    // every array item
    arr = arr.map(k => {
      return (k - mean) ** 2;
    });

    // Calculating the sum of updated array
    let sum = arr.reduce((acc, curr) => acc + curr, 0);

    // Calculating the variance
    let variance = sum / arr.length;

    // Returning the standard deviation
    let sd = Math.sqrt(sum / arr.length);

    return { mean: mean, variance: variance, standard_deviation: sd };
  }

  stopTranslating() {
    this.ClearSilenceInterval();
    this.target = null;
    this.targetLanguage = null;

    if (this.recordingAverage.length) console.log("average rec", this.statisticalAnalysis(this.recordingAverage));
    if (this.inactiveAverage.length) console.log("average ina", this.statisticalAnalysis(this.inactiveAverage));

    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.forcefail = true;
      this.mediaRecorder.stop();
    }
    APP.scene.emit("translation-stopped");
  }

  UpdateTarget(newTargetDetails) {
    this.stopTranslating();

    this.target = newTargetDetails.target;
    this.targetLanguage = newTargetDetails.language;
    console.log(`new target properties setted`);
    const announcedProperties = { owner: this.target, language: this.targetLanguage };
    APP.scene.emit("translation-target-updated", announcedProperties);
    this.MonitorTargetAudio();
  }

  updateTargetProperties(newProperties) {
    const announcedProperties = { language: newProperties.language };

    if (this.targetLanguage !== newProperties.language) {
      APP.scene.emit("translation_target_properties_updated", announcedProperties);
      this.targetLanguage = newProperties.language;
    }
  }

  async MonitorTargetAudio() {
    console.log(`Start monitoring audio of target ${this.target}`);

    this.recordingAverage = [];
    this.inactiveAverage = [];

    const stream = await this.GetTargetStream(this.target);
    const chunks = [];

    //Setting up media Recorder
    this.mediaRecorder = new MediaRecorder(stream);

    this.mediaRecorder.ondataavailable = event => {
      chunks.push(event.data);
    };
    this.mediaRecorder.onstop = () => {
      this.InferenceAudio(chunks);
    };
    this.mediaRecorder.onerror = () => {
      return {
        status: { code: RECORDER_CODES.ERROR, text: RECORDER_TEXT[RECORDER_CODES.ERROR] }
      };
    };

    //Settting up Silence Detector
    const audioContext = new window.AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const silenceThreshold = 25;
    const timeInterval = 20;
    const silenceDurationThreshold = 30 * timeInterval;
    let consecutiveSilentIntervals = 0;
    let isSilent = true;

    const SilenceDetection = () => {
      analyser.getByteFrequencyData(dataArray);
      const averageAmplitude = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

      if (averageAmplitude < silenceThreshold) {
        consecutiveSilentIntervals += timeInterval;
        if (consecutiveSilentIntervals > silenceDurationThreshold) isSilent = true;
      } else {
        consecutiveSilentIntervals = 0;
        isSilent = false;
      }
      if (this.mediaRecorder.state === "inactive" && !isSilent) {
        this.mediaRecorder.start();
        console.log(`Start recording`);
      } else if (this.mediaRecorder.state === "recording" && isSilent) {
        this.mediaRecorder.stop();
        console.log(`Stop recording`);
      }

      if (this.mediaRecorder.state === "recording") this.recordingAverage.push(averageAmplitude);
      if (this.mediaRecorder.state === "inactive") this.inactiveAverage.push(averageAmplitude);
    };

    this.silenceCheckInterval = setInterval(SilenceDetection, timeInterval);
  }

  async InferenceAudio(chunks) {
    if (this.inferencing) return;
    const recordingBlob = new Blob(chunks, { type: "audio/wav" });
    const inference =
      chunks.length > 0 && recordingBlob.size > 0 && this.hasMyLanguage && this.hasTargetLanguage && !this.forcefail;
    chunks.length = 0;

    console.log(`Inferencing audio? ${inference}`);

    if (inference) {
      // this.saveAudio(recordingBlob);
      this.inferencing = true;

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

      this.inferencing = false;

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
    } else {
      this.forcefail = false;
    }
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
