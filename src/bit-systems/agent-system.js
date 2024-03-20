import { addComponent, defineQuery, enterQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { Agent, Hidden, Interacted, LookAtUser } from "../bit-components";
import { UpdateTextSystem, lowerIndex, raiseIndex } from "./agent-slideshow-system";
import { PermissionStatus } from "../utils/media-devices-utils";
import { stageUpdate } from "../systems/single-action-button-system";
import {
  audioModules,
  intentionModule,
  dsResponseModule,
  vlModule,
  textModule,
  RecordQuestion,
  stopRecording
} from "../utils/ml-adapters";
import { COMPONENT_ENDPOINTS } from "../utils/component-types";
import { AgentEntity } from "../prefabs/agent";
import { SnapDepthPOV, SnapPOV } from "../utils/vlm-adapters";
import { navSystem } from "./routing-system";
import { renderAsEntity } from "../utils/jsx-entity";
import { languageCodes, translationSystem } from "./translation-system";
import { UpdatePanelSize, GetTextSize } from "../utils/interactive-panels";
import { agentDialogs } from "../utils/localization";
import { Logger } from "../utils/logging_systems";
import { Vector3 } from "three";

const agentQuery = defineQuery([Agent]);
const enterAgentQuery = enterQuery(agentQuery);
const PANEL_PADDING = 0.05;
const skipModule = false;

function clicked(eid) {
  return hasComponent(APP.world, Interacted, eid);
}

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function AgentSystem(t) {
  enterAgentQuery(APP.world).forEach(eid => {
    virtualAgent.Setup(eid);
  });
  agentQuery(APP.world).forEach(_ => {
    virtualAgent.ButtonInteractions();
    virtualAgent.Animations(t);
    virtualAgent.agent.obj.updateMatrix();
  });
}

export class objElement {
  constructor() {
    this.eid = null;
    this.obj = null;
    this.size = null;
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
    this.infoPanel = new objElement();
    this.snapButton = new objElement();
    this.clearButton = new objElement();
    this.agentParent = new objElement();

    this.panel = new objElement();
    this.text = new textElement();

    this.refsList = [];
    this.currentOccasion = null;
    this.waitingForResponse = null;

    this.micStatus = false;
    this.loadingObj = null;
    this.isProccessing = false;
    this.isListening = false;
    this.successResult = false;

    this.onClear = this.onClear.bind(this);
    this.onToggle = this.onToggle.bind(this);
    this.setMicStatus = this.setMicStatus.bind(this);
    this.onLanguageUpdated = this.onLanguageUpdated.bind(this);
    this.OntextUpdate = this.OntextUpdate.bind(this);

    this.occasions = {
      greetings: ["greetings"],
      success: ["success", "anythingElse"],
      cleared: ["anythingElse"],
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
    // APP.scene.emit("agent-toggle");
    this.navProperties = hubProperties;
  }

  Remove() {
    this.text.obj.removeEventListener("synccomplete", this.OntextUpdate);
    APP.scene.removeEventListener("language_updated", this.onLanguageUpdated);
    APP.dialog.off("mic-state-changed", this.setMicStatus);

    removeEntity(APP.world, this.agentParent.eid);
    removeEntity(APP.world, this.agent.eid);
    APP.scene.removeState("agent");
    // this.refsList.forEach(ref => {
    //   removeEntity(APP.world, ref.eid);
    // });

    // APP.scene.remove(this.agent.obj);
  }

  Instantiate() {
    APP.scene.addState("agent");
    const eid = renderAsEntity(APP.world, AgentEntity());

    const obj = APP.world.eid2obj.get(eid);
    APP.world.scene.add(obj);
    this.agentParent.update(eid);
  }

  Setup(agentEid) {
    this.agent.update(agentEid);
    this.nextArrow.update(Agent.nextRef[agentEid]);
    this.prevArrow.update(Agent.prevRef[agentEid]);
    this.infoPanel.update(Agent.micRef[agentEid]);
    this.snapButton.update(Agent.snapRef[agentEid]);
    this.clearButton.update(Agent.navRef[agentEid]);
    this.panel.update(Agent.panelRef[agentEid]);
    this.text.update(Agent.textRef[agentEid]);

    this.refsList = [
      this.nextArrow,
      this.prevArrow,
      this.infoPanel,
      this.snapButton,
      this.clearButton,
      this.panel,
      this.text
    ];

    const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
    physicsSystem.updateRigidBodyOptions(agentEid, {
      type: "kinematic",
      gravity: {
        x: 0,
        y: 0,
        z: 0
      }
    });

    //Do not delete this, these are for VLM. Try to not use them, but practice TODO: Migrate
    this.scene = AFRAME.scenes[0];
    this.camera = this.scene.camera;
    this.renderer = this.scene.renderer;
    //-----------------------------------------

    this.isProccessing = false;
    this.isListening = false;
    this.successResult = false;

    // this.UpdateText("Hello I am your personal Agent");

    this.infoPanel.obj.children[0].text = "";
    const dotGeometry = new THREE.CircleBufferGeometry(0.02, 12);
    this.loadingObj = new THREE.Group();
    this.loadingObj.position.set(0, 0, 0.01);
    for (let i = 0; i < 5; i++) {
      const dot = new THREE.Mesh(
        dotGeometry,
        new THREE.MeshBasicMaterial({ transparent: true, color: 0x000000, depthWrite: false })
      );
      dot.position.x = i * 0.07 - 0.14;
      this.loadingObj.add(dot);
    }

    this.infoPanel.obj.add(this.loadingObj);

    this.text.obj.addEventListener("synccomplete", this.OntextUpdate);

    this.UpdateWithRandomPhrase("greetings");
    this.micStatus = false;
    APP.dialog.on("mic-state-changed", this.setMicStatus);
    this.waitingForResponse = false;
    APP.mediaDevicesManager.micEnabled = false;
    APP.scene.addEventListener("language_updated", this.onLanguageUpdated);
    this.agent.obj.visible = true;
    this.infoPanel.obj.visible = false;
  }

  Cleanup() {
    this.agent.update(null);
    this.nextArrow.update(null);
    this.prevArrow.update(null);
    this.infoPanel.update(null);
    this.snapButton.update(null);
    this.clearButton.update(null);
    this.panel.update(null);
    this.text.update(null);
    this.agentParent.update(null);

    this.loadingObj = null;
    this.isProccessing = false;
    this.isListening = false;
    this.successResult = false;

    this.currentOccasion = null;
    this.waitingForResponse = null;

    this.refsList = [];
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

  OntextUpdate() {
    const size = GetTextSize(this.text.obj);
    size[0] += 2 * PANEL_PADDING;
    size[1] += 2 * PANEL_PADDING;
    UpdatePanelSize(this.panel.eid, size);
    this.panel.size = size;

    if (this.successResult) {
      this.clearButton.obj.position.copy(new Vector3(0, -size[1] / 2 + PANEL_PADDING, 0.2));
      this.clearButton.obj.updateMatrix();
      this.clearButton.obj.visible = true;
    } else {
      this.clearButton.obj.visible = false;
    }
  }

  UpdateText(newText) {
    this.text.obj.text = newText;
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
      }
    }
  }

  async ButtonInteractions() {
    if (clicked(this.clearButton.eid)) {
      navSystem.StopNavigating();
      this.successResult = false;
      this.UpdateWithRandomPhrase("cleared");
    }
  }

  Animations(t) {
    this.loadingObj.visible = true;
    if (this.isListening) this.ListeningAnimation(t);
    else if (this.isProccessing) this.ProccessingAnimation(t);
    else this.loadingObj.visible = false;
  }

  ProccessingAnimation(t) {
    let typingAnimTime = 0;
    typingAnimTime = t;
    this.loadingObj.lookAt(this.avatarPovObj.getWorldPosition(new THREE.Vector3()));
    this.loadingObj.traverse(o => {
      if (o.material) {
        o.material.opacity = (Math.sin(typingAnimTime / 150) + 1) / 2;
        typingAnimTime -= 150;
      }
    });
  }

  ListeningAnimation(t) {
    let typingAnimTime = 0;
    typingAnimTime = t * 0.8;
    this.loadingObj.lookAt(this.avatarPovObj.getWorldPosition(new THREE.Vector3()));
    this.loadingObj.traverse(o => {
      if (o.material) o.material.opacity = (Math.sin(typingAnimTime / 150) + 1) / 2;
    });
  }

  async TestNavigationUI() {
    const targets = this.navProperties.navigation.targets;
    const avatarPosition = this.avatarPos;

    const update = () => {
      this.UpdateText(
        `This is a demo text that gives you guidance to reach the random destination with index \nYou will find your destination called  by following the green lines and the blue arrows. \nWe hope this text is large enough so it takes up a lot of space and will allow us to test also the transparent nametag texture.\nThank you, if you have any further questions do not hesitate to reach me.`
      );
    };

    return new Promise(resolve => {
      console.log("waiting");
      setTimeout(function () {
        // Your code to be executed after the delay (2 seconds in this case)
        const randInt = getRandomInt(targets.length);

        const navigation = navSystem.GetInstructions(avatarPosition, targets[randInt].name);

        if (navigation.valid) {
          navSystem.RenderCues(navigation);
        }

        update();

        resolve();
      }, 2000);
    });
  }

  async AskAgent(savefile) {
    this.panel.obj.visible = false;
    this.infoPanel.obj.visible = true;
    this.waitingForResponse = true;
    this.setMicStatus();

    try {
      logger.action = "dialog_system";

      const recordedQuestion = await RecordQuestion(savefile);

      // this.isProccessing = true;

      // await this.TestNavigationUI();

      // return;

      this.isProccessing = true;
      // UpdatePanelSize(this.panel.eid, [0.02, 0.01]);

      const sourceLang = translationSystem.mylanguage ? languageCodes[translationSystem.mylanguage] : "en";
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

      const targetLang = translationSystem.mylanguage ? languageCodes[translationSystem.mylanguage] : "en";
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

      if (intentResponse.data.intent.includes("navigation") && navigation.valid) {
        this.successResult = true;
        navSystem.RenderCues(navigation);
      } else if (intentResponse.data.intent.includes("program_info")) {
        this.successResult = true;
      } else {
        this.successResult = false;
      }

      this.UpdateText(output);
    } catch (error) {
      console.log("error", error);
      this.UpdateWithRandomPhrase("error");
    } finally {
      this.infoPanel.obj.visible = false;
      this.isProccessing = false;
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
    const lang = translationSystem.mylanguage ? translationSystem.mylanguage : "english";

    this.occasions[occasion].forEach(occasionKey => {
      const availablePhrases = agentDialogs[occasionKey][lang];

      const randomIndex = Math.floor(Math.random() * availablePhrases.length);

      phrases.push(availablePhrases[randomIndex]);
    });

    this.UpdateText(phrases.length === 1 ? phrases[0] : phrases.join(" "));
    this.currentOccasion = occasion;
  }

  GetTypingObj() {
    return typingObj;
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
