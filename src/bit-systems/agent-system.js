import { addComponent, defineQuery, enterQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { Agent, Hidden, Interacted } from "../bit-components";
import { UpdateTextSystem, lowerIndex, raiseIndex } from "./agent-slideshow-system";
import { PermissionStatus } from "../utils/media-devices-utils";
import { stageUpdate } from "../systems/single-action-button-system";
import {
  audioModules,
  intentionModule,
  dsResponseModule,
  toggleRecording,
  vlModule,
  textModule,
  RecordQuestion,
  stopRecording
} from "../utils/asr-adapter";
import { COMPONENT_ENDPOINTS } from "../utils/component-types";
import { AgentEntity } from "../prefabs/agent";
import { SnapDepthPOV, SnapPOV } from "../utils/vlm-adapters";
import { navSystem } from "./routing-system";
import { renderAsEntity } from "../utils/jsx-entity";
import { languageCodes, subtitleSystem } from "./subtitling-system";
import UpdateTextPanel from "../utils/interactive-panels";
import { agentDialogs } from "../utils/localization";
import { Logger } from "../utils/logging_systems";

const agentQuery = defineQuery([Agent]);
const enterAgentQuery = enterQuery(agentQuery);
const skipModule = false;

function clicked(eid) {
  return hasComponent(APP.world, Interacted, eid);
}

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function AgentSystem() {
  enterAgentQuery(APP.world).forEach(eid => {
    virtualAgent.Setup(eid);
  });
  agentQuery(APP.world).forEach(_ => {
    virtualAgent.ButtonInteractions();
    virtualAgent.agent.obj.updateMatrix();
  });
}

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

class textElement extends objElement {
  constructor() {
    super();
    this.value = null;
  }
}

export default class VirtualAgent {
  constructor() {
    this.allowed = null;

    this.agent = new objElement();
    this.nextArrow = new objElement();
    this.prevArrow = new objElement();
    this.micButton = new objElement();
    this.snapButton = new objElement();
    this.panel = new objElement();
    this.text = new textElement();
    this.currentOccasion = null;
    this.waitingForResponse = null;
    this.micStatus = false;

    this.onClear = this.onClear.bind(this);
    this.onToggle = this.onToggle.bind(this);
    this.setMicStatus = this.setMicStatus.bind(this);
    this.onLanguageUpdated = this.onLanguageUpdated.bind(this);

    this.occasions = {
      greetings: ["greetings"],
      success: ["success", "anythingElse"],
      cleared: ["cleared", "anythingElse"],
      error: ["error"]
    };
  }

  Init(hubProperties, reset) {
    if (reset) {
      APP.scene.removeEventListener("agent-toggle", this.onToggle);
      APP.scene.removeEventListener("clear-scene", this.onClear);
    }

    if (!hubProperties.allow_agent) {
      this.allowed = false;
      console.warn("Virtual Agent is not enabled in this room");
      return;
    }

    this.allowed = true;
    this.avatarPovObj = document.querySelector("#avatar-pov-node").object3D;
    APP.scene.addEventListener("agent-toggle", this.onToggle);
    APP.scene.addEventListener("clear-scene", this.onClear);
    APP.scene.emit("agent-toggle");
  }

  Remove() {
    APP.scene.removeEventListener("language_updated", this.onLanguageUpdated);
    APP.dialog.off("mic-state-changed", this.setMicStatus);
    APP.scene.remove(this.agent.obj);
    removeEntity(APP.world, this.agent.eid);
    APP.scene.removeState("agent");
  }

  Instantiate() {
    APP.scene.addState("agent");
    const eid = renderAsEntity(APP.world, AgentEntity());
    const obj = APP.world.eid2obj.get(eid);
    APP.world.scene.add(obj);
  }

  Setup(agentEid) {
    this.agent.update(agentEid);
    this.nextArrow.update(Agent.nextRef[agentEid]);
    this.prevArrow.update(Agent.prevRef[agentEid]);
    this.micButton.update(Agent.micRef[agentEid]);
    this.snapButton.update(Agent.snapRef[agentEid]);
    this.panel.update(Agent.panelRef[agentEid]);
    this.text.update(Agent.textRef[agentEid]);

    //Do not delete this, these are for VLM. Try to not use them, but practice TODO: Migrate
    this.scene = AFRAME.scenes[0];
    this.camera = this.scene.camera;
    this.renderer = this.scene.renderer;
    //-----------------------------------------

    // this.UpdateText("Hello I am your personal Agent");
    this.UpdateWithRandomPhrase("greetings");
    this.micStatus = false;
    APP.dialog.on("mic-state-changed", this.setMicStatus);
    this.waitingForResponse = false;
    APP.mediaDevicesManager.micEnabled = false;
    APP.scene.addEventListener("language_updated", this.onLanguageUpdated);
    this.agent.obj.visible = true;
    this.micButton.obj.visible = false;
  }

  Cleanup() {
    this.agent.update(null);
    this.nextArrow.update(null);
    this.prevArrow.update(null);
    this.micButton.update(null);
    this.snapButton.update(null);
    this.panel.update(null);
    this.text.update(null);

    this.currentOccasion = null;
    this.waitingForResponse = null;
  }

  onClear() {
    if (APP.scene.is("agent")) {
      this.Remove();
    }
  }

  onToggle() {
    if (!APP.scene.is("agent")) {
      APP.scene.emit("clear-scene");
      this.Instantiate();
    } else {
      this.Remove();
    }
  }

  onLanguageUpdated(event) {
    this.UpdateWithRandomPhrase(this.currentOccasion);
  }

  UpdateText(text) {
    console.log(`Updating text with: "${text}"`);
    UpdateTextPanel(text, this.text.obj, this.panel.eid, false, true);
    this.text.value = text;
  }

  setMicStatus() {
    const permissionsGranted = APP.mediaDevicesManager.getPermissionsStatus("microphone") === PermissionStatus.GRANTED;
    const changedMicStatus = this.micStatus !== (permissionsGranted && APP.mediaDevicesManager.isMicEnabled);
    if (changedMicStatus) {
      this.micStatus = permissionsGranted && APP.mediaDevicesManager.isMicEnabled;
      if (this.micStatus && !this.waitingForResponse) {
        this.AskAgent(false);
      } else {
        stopRecording();

        this.micButton.obj.children[0].text = "Not listeling...";
        this.micButton.obj.visible = false;
      }
    }
  }

  async ButtonInteractions() {
    if (clicked(this.micButton.eid)) {
    }
  }

  async AskAgent(savefile) {
    this.micButton.obj.children[0].text = "Listening...";
    this.micButton.obj.visible = true;
    this.waitingForResponse = true;
    this.setMicStatus();

    try {
      logger.action = "dialog_system";
      const recordedQuestion = await RecordQuestion(savefile);
      this.panel.obj.visible = false;
      const sourceLang = subtitleSystem.mylanguage ? languageCodes[subtitleSystem.mylanguage] : "en";
      const nmtAudioParams = { source_language: sourceLang, target_language: "en", return_transcription: "true" };

      logger.audioTranslation.start = new Date();
      const nmtResponse = await audioModules(
        COMPONENT_ENDPOINTS.TRANSLATE_AUDIO_FILES,
        recordedQuestion.data.file,
        nmtAudioParams
      );

      logger.audioTranslation.finish = new Date();
      logger.audioTranslation.input = {
        file: "audiofile",
        source_language: nmtAudioParams.source_language,
        target_language: nmtAudioParams.target_language
      };
      logger.audioTranslation.output = {
        translation: nmtResponse.data.transcriptions[0],
        transcription: nmtResponse.data.translations[0]
      };

      logger.intent.start = new Date();
      const intentResponse = await intentionModule(nmtResponse.data.translations[0]);
      logger.intent.finish = new Date();
      logger.intent.input = nmtResponse.data.translations[0];
      logger.intent.output = { intent: intentResponse.data.intent, destination: intentResponse.data.destination };

      const navigation = navSystem.GetInstructions(this.avatarPos, intentResponse.data.destination);

      logger.response.start = new Date();
      const response = await dsResponseModule(
        nmtResponse.data.translations[0],
        intentResponse.data.intent,
        navigation.knowledge
      );
      logger.response.finish = new Date();
      logger.response.input = {
        user_query: nmtResponse.data.translations[0],
        intent: intentResponse.data.intent,
        mozilla_input: navigation.knowledge
      };
      logger.response.output = response.data.response;

      const targetLang = subtitleSystem.mylanguage ? languageCodes[subtitleSystem.mylanguage] : "en";
      const nmtTextParams = { source_language: "en", target_language: targetLang };
      let output;
      if (nmtTextParams.source_language === nmtTextParams.target_language) {
        output = response.data.response;
        logger.textTranslation.total = 0;
      } else {
        const segmentedOutput = response.data.response.split("\n");

        const translatePromises = [];
        logger.textTranslation.start = new Date();
        segmentedOutput.forEach(sentence => {
          const translatePromise =
            sentence.length === 0
              ? new Promise(resolve => {
                  resolve({ data: { translations: [""] } });
                })
              : textModule(COMPONENT_ENDPOINTS.TRANSLATE_TEXT, sentence, nmtTextParams);
          translatePromises.push(translatePromise);
        });

        const translatedResponses = await Promise.all(translatePromises);
        console.log(translatePromises);
        output = translatedResponses
          .map(element => {
            return element.data.translations[0];
          })
          .join("\n");

        logger.textTranslation.finish = new Date();
        logger.textTranslation.output = output;
        logger.textTranslation.input = {
          text: response.data.response,
          source_language: nmtTextParams.source_language,
          target_language: nmtTextParams.target_language
        };
      }

      this.UpdateText(output);
      console.log(navigation.valid, intentResponse.data.intent);
      if (navigation.valid && intentResponse.data.intent.includes("navigation")) navSystem.RenderCues(navigation);
    } catch (error) {
      console.log("error", error);
      this.UpdateWithRandomPhrase("error");
    } finally {
      this.panel.obj.visible = true;
      this.setMicStatus();
      this.waitingForResponse = false;
      logger.Log();
    }
  }

  DatasetCreate(destination) {
    const navigation = navSystem.GetInstructions(this.avatarPos, destination);
    console.log(`{"destination": "${destination}", "intent":"navigation", "mozilla_input":${navigation.knowledge}},`);
  }

  async SnapActions() {
    try {
      const responses = await Promise.all([SnapPOV(this.agent.obj, false), SnapDepthPOV(false)]);
      const vlResponse = await vlModule(responses[0], COMPONENT_ENDPOINTS.LXMERT);
      console.log(vlResponse);
    } catch (error) {
      console.log(error);
    }
  }

  HandleArrows(renderArrows) {
    this.nextArrow.obj.visible = renderArrows;
    this.prevArrow.obj.visible = renderArrows;
  }

  UpdateWithRandomPhrase(occasion) {
    const phrases = [];
    const lang = subtitleSystem.mylanguage ? subtitleSystem.mylanguage : "english";
    console.log(`Lang: ${lang}, occasions: ${this.occasions[occasion]}`);
    this.occasions[occasion].forEach(occasionKey => {
      const availablePhrases = agentDialogs[occasionKey][lang];

      const randomIndex = Math.floor(Math.random() * availablePhrases.length);

      phrases.push(availablePhrases[randomIndex]);
    });

    console.log(phrases);
    this.UpdateText(phrases.length === 1 ? phrases[0] : phrases.join(" "));
    this.currentOccasion = occasion;
  }

  get exists() {
    return !!this.agent.eid;
  }

  get avatarDirection() {
    const playerForward = new THREE.Vector3();
    this.avatarPovObj.getWorldDirection(playerForward);
    return playerForward.multiplyScalar(-1);
  }

  get avatarPos() {
    const avatarPos = new THREE.Vector3();
    this.avatarPovObj.getWorldPosition(avatarPos);
    return avatarPos;
  }

  get flatAvatarDirection() {
    return virtualAgent.avatarDirection.setY(0).normalize();
  }
}

export const virtualAgent = new VirtualAgent();
export const logger = new Logger();
