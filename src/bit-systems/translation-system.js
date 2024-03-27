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
import { mediaSortOrder } from "../utils/media-sorting";
import { FixedPanel } from "../prefabs/fixed-panel";

export const languageCodes = {
  greek: "el",
  english: "en",
  spanish: "es",
  italian: "it",
  dutch: "nl",
  german: "de"
};

export class TranslationSystem {
  constructor() {
    this.targets;
    this.mylanguage;
    this.targetLanguage;
    this.silenceCheckInterval;
    this.forcefail;
    this.avatarPovObj;
    this.fixedPanelObj;
    this.proccessingQueue = {};
    this.inferencingQueue = {};

    this.onLanguageAvailable = this.onLanguageAvailable.bind(this);
    this.onTranslationUpdatesAvailable = this.onTranslationUpdatesAvailable.bind(this);
    this.InferenceAudio = this.InferenceAudio.bind(this);
    this.UpdatePresenterTarget = this.UpdatePresenterTarget.bind(this);
  }

  Init(hubProperties, reset) {
    if (reset) {
      this.targets = {};
      this.allowed = hubProperties.translation.allow;

      if (!this.allowed) console.warn("Translation is not enabled in this room");
      return;
    }

    this.allowed = hubProperties.translation.allow;
    this.transProperties = hubProperties.translation;
    this.targets = {};
    this.avatarPovObj = document.querySelector("#avatar-pov-node").object3D;

    this.updateMyLanguage("english");

    this.silenceCheckInterval = [];

    if (!this.allowed) console.warn("Translation is not enabled in this room");
    if (this.transProperties.spatiality.type === "borders") {
      this.borders = this.transProperties.spatiality.data;
      this.prevBorderState = false;
    }

    if (this.transProperties.panel.type === "fixed") {
      this.onToggleTranslate = () => {
        if (!this.fixedPanelObj) {
          const pos = this.transProperties.panel.data;
          const eid = renderAsEntity(APP.world, FixedPanel({ pos }));
          this.fixedPanelObj = APP.world.eid2obj.get(eid);
          this.eid = eid;
          APP.world.scene.add(this.fixedPanelObj);
          APP.scene.addState("translation");
        } else {
          APP.world.scene.remove(this.fixedPanelObj);
          removeEntity(APP.world, this.eid);
          this.fixedPanelObj = null;
          this.eid = null;
          APP.scene.removeState("translation");
        }
      };
      APP.scene.addEventListener("toggle_translation", this.onToggleTranslate);
    }

    this.recordingAverage = [];
    this.inactiveAverage = [];
    this.forcefail = false;
    this.inferencing = false;

    APP.scene.addEventListener("language_available", this.onLanguageAvailable);
    APP.scene.addEventListener("translation_updates_available", this.onTranslationUpdatesAvailable);

    this.initialized = true;
  }

  ClearSilenceInterval() {
    clearInterval(this.silenceCheckInterval);
    this.silenceCheckInterval = null;
  }

  async onTranslationUpdatesAvailable({ detail: updates }) {
    const eventkey = updates.id;
    try {
      if (this.proccessingQueue[eventkey]) {
        console.log(`another request for this user is pending`);
        return;
      }

      this.proccessingQueue[eventkey] = true;

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Timeout occurred while processing event`));
        }, 5000); // Adjust the timeout duration as needed
      });

      let actionPromise;

      if (updates.type === "add") actionPromise = this.AddTarget(updates);
      else if (updates.type === "remove") actionPromise = this.RemoveTarget(updates);
      else if (updates.type === "presenter") actionPromise = this.UpdatePresenterTarget(updates);

      await Promise.race([actionPromise, timeoutPromise]);

      APP.scene.emit("translation_updates_applied", updates);
    } catch (error) {
      console.error(error);
    } finally {
      delete this.proccessingQueue[eventkey];
    }
  }

  async UpdatePresenterTarget(newTarget) {
    console.log("updating presenter", newTarget);

    Object.keys(this.targets).forEach(targetKey => {
      this.RemoveTarget({ id: targetKey });
      console.log("removing target", targetKey);
    });

    if (newTarget.action) await this.MonitorTargetAudio(newTarget);
  }

  async AddTarget(newTarget) {
    if (!this.targets[newTarget.id]) await this.MonitorTargetAudio(newTarget);
    else this.targets[newTarget.id].language = newTarget.language;
  }

  async RemoveTarget(target) {
    if (!this.targets[target.id]) return;

    const mediaRecorder = this.targets[target.id].mediaRecorder;
    if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
    clearInterval(this.targets[target.id].interval);
    delete this.targets[target.id];
    console.log(`target removed ${target.id}`);
  }

  async MonitorTargetAudio(target) {
    console.log(`Start monitoring audio of target ${target.id}`);

    const stream = await this.GetTargetStream(target.id);
    const chunks = [];
    const mediaRecorder = new MediaRecorder(stream);

    //Setting up media Recorder

    mediaRecorder.ondataavailable = event => {
      chunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
      this.InferenceAudio(chunks, target);
    };
    mediaRecorder.onerror = () => {
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
      try {
        analyser.getByteFrequencyData(dataArray);
        const averageAmplitude = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

        if (averageAmplitude < silenceThreshold) {
          consecutiveSilentIntervals += timeInterval;
          if (consecutiveSilentIntervals > silenceDurationThreshold) isSilent = true;
        } else {
          consecutiveSilentIntervals = 0;
          isSilent = false;
        }
        if (mediaRecorder.state === "inactive" && !isSilent) {
          mediaRecorder.start();
          console.log(`Start recording`);
        } else if (mediaRecorder.state === "recording" && isSilent) {
          mediaRecorder.stop();
          console.log(`Stop recording`);
        }
      } catch (error) {
        this.onTranslationUpdatesAvailable({ detail: { type: "remove", id: target.id } });
      }
    };

    const interval = setInterval(SilenceDetection, timeInterval);
    this.targets[target.id] = { language: target.language, mediaRecorder: mediaRecorder, interval: interval };
    console.log(`new target registered`);
    return;
  }

  async InferenceAudio(chunks, target) {
    if (this.inferencingQueue[target.id]) {
      this.inferencingQueue[target.id].abort();
    }

    let abortController = new AbortController();

    this.inferencingQueue[target.id] = abortController;

    try {
      const recordingBlob = new Blob(chunks, { type: "audio/wav" });
      const inference = chunks.length > 0 && recordingBlob.size > 0;
      chunks.length = 0;

      if (inference) {
        // this.saveAudio(recordingBlob);
        //   this.inferencing = true;

        const inferenceParams = {
          source_language: languageCodes[target.language],
          target_language: languageCodes[this.mylanguage],
          return_transcription: "true"
        };

        const translateRespone = await audioModules(
          COMPONENT_ENDPOINTS.TRANSLATE_AUDIO_FILES,
          recordingBlob,
          inferenceParams,
          abortController.signal
        );

        APP.scene.emit("translation_available", { id: target.id, text: translateRespone.data.translations[0] });
        // UpdateTextSystem(APP.world, translateRespone.data.translations[0]);
      } else {
        this.forcefail = false;
      }
    } catch (error) {
      console.log(`fetch aborted`);
    } finally {
      abortController = null;
      delete this.inferencingQueue[target.id];
    }
  }

  onLanguageAvailable(event) {
    this.updateMyLanguage(event.detail.language);
  }

  updateMyLanguage(newLang) {
    this.mylanguage = newLang;
    if (!!this.mylanguage) {
      window.APP.store.update({ profile: { language: this.mylanguage } });
      APP.scene.emit("language_updated", { language: this.mylanguage });
    }
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
    try {
      const stream = await APP.dialog.getMediaStream(peerID);
      if (!stream) {
        new Error(INFO_INIT_FAILED, `Error getting media stream for ${peerID}`, e);
      }

      console.log(`stream collected`);
      return stream;
    } catch (e) {
      throw new Error(INFO_INIT_FAILED, `Error getting media stream for ${peerID}`, e);
    }
  }

  tick() {
    if (!this.initialized || !APP.scene.is("entered")) return;

    const selfPos = this.avatarPovObj.getWorldPosition(new THREE.Vector3());
    if (this.transProperties.spatiality.type !== "borders") return;

    const withinBorders =
      this.borders[0] < selfPos.x &&
      selfPos.x < this.borders[1] &&
      this.borders[2] < selfPos.z &&
      selfPos.z < this.borders[3]; //z borders are flipped NOTICE

    if (withinBorders !== this.prevBorderState) {
      APP.scene.emit("border_state_change", withinBorders);
      this.prevBorderState = withinBorders;

      if (!withinBorders) {
        Object.keys(this.targets).forEach(key => {
          this.onTranslationUpdatesAvailable({ detail: { type: "remove", id: key } });
        });
      }
    }
  }
}

export const translationSystem = new TranslationSystem();
