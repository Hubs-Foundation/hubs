import { addComponent, defineQuery, enterQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { Agent, CursorRaycastable, Hidden, Interacted, LookAtUser } from "../bit-components";
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
import { UpdatePanelSize, GetTextSize, GetObjSize } from "../utils/interactive-panels";
import { agentDialogs } from "../utils/localization";
import { Logger } from "../utils/logging_systems";
import { AxesHelper, Vector3 } from "three";
import { roomPropertiesReader } from "../utils/rooms-properties";
import { logger } from "./logging-system";

const agentQuery = defineQuery([Agent]);
const enterAgentQuery = enterQuery(agentQuery);
const PANEL_PADDING = 0.05;

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
    this.displayedText = new textElement();

    this.textArray = [];
    this.diplayedSenteceIndex = null;

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
    this.OntextUpdate = this.OntextUpdate.bind(this);

    this.occasions = {
      greetings: ["greetings"],
      success: ["success", "anythingElse"],
      cleared: ["anythingElse"],
      error: ["error"]
    };
  }

  Init(reset) {
    if (reset && this.allowed) {
      APP.scene.removeEventListener("agent-toggle", this.onToggle);
      APP.scene.removeEventListener("clear-scene", this.onClear);
      this.Remove();
    }

    if (!roomPropertiesReader.AllowsAgent) {
      this.allowed = false;
      console.warn("Virtual Agent is not enabled in this room");
      return;
    }

    this.allowed = true;
    APP.scene.addEventListener("agent-toggle", this.onToggle);
    APP.scene.addEventListener("clear-scene", this.onClear);
    this.navProperties = roomPropertiesReader.navProps;

    this.Instantiate();
  }

  Enable() {
    this.displayedText.obj.addEventListener("synccomplete", this.OntextUpdate);
    this.UpdateWithRandomPhrase("greetings");
    APP.dialog.on("mic-state-changed", this.setMicStatus);
    APP.scene.addState("agent");
    this.ToggleRays(true);
    this.agent.obj.position.copy(this.AgentInitialPosition);
    this.agent.obj.rotation.set(0, 0, 0);
  }

  Disable() {
    this.displayedText.obj.removeEventListener("synccomplete", this.OntextUpdate);
    APP.dialog.off("mic-state-changed", this.setMicStatus);
    APP.scene.removeState("agent");
    this.agentParent.obj.visible = false;
    this.ToggleRays(false);
  }

  ToggleRays(show) {
    const action = show ? addComponent : removeComponent;
    action(APP.world, CursorRaycastable, this.agent.eid);
    action(APP.world, CursorRaycastable, this.clearButton.eid);
    action(APP.world, CursorRaycastable, this.nextArrow.eid);
    action(APP.world, CursorRaycastable, this.prevArrow.eid);
    action(APP.world, CursorRaycastable, this.panel.eid);
    action(APP.world, CursorRaycastable, this.displayedText.eid);
    action(APP.world, CursorRaycastable, this.agentParent.eid);
    action(APP.world, CursorRaycastable, this.infoPanel.eid);
  }

  Remove() {
    if (APP.scene.is("agent")) this.Disable;
    removeEntity(APP.world, this.agentParent.eid);
    removeEntity(APP.world, this.agent.eid);
    APP.scene.removeState("agent");
    APP.scene.remove(this.agentParent.obj);
  }

  Instantiate() {
    if (APP.scene.is("agent")) this.Remove();
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
    this.clearButton.update(Agent.navRef[agentEid]);
    this.panel.update(Agent.panelRef[agentEid]);
    this.displayedText.update(Agent.textRef[agentEid]);
    this.snapButton.update(Agent.snapRef[agentEid]);

    this.isProccessing = false;
    this.isListening = false;
    this.successResult = false;
    this.micStatus = false;
    this.waitingForResponse = false;
    APP.mediaDevicesManager.micEnabled = false;
    this.agent.obj.visible = true;
    this.infoPanel.obj.visible = false;
    this.agentParent.obj.visible = false;

    this.AgentInitialPosition = this.agent.obj.position.clone();

    this.AddAnimationDots();
    this.ToggleRays(false);
  }

  onClear() {
    if (APP.scene.is("agent")) {
      this.Disable();
    }
  }

  onToggle() {
    if (!APP.scene.is("agent")) {
      APP.scene.emit("clear-scene");
      this.Enable();
      // logger.AddUiInteraction("agent_toggle", "activate_agent");
    } else {
      this.Disable();
      // logger.AddUiInteraction("agent_toggle", "deactivate_agent");
    }
  }

  OntextUpdate() {
    const size = GetTextSize(this.displayedText.obj);
    const arrowSize = GetObjSize(this.nextArrow.obj);
    const clearSize = GetObjSize(this.clearButton.obj);
    size[0] += 2 * PANEL_PADDING;
    size[1] += 2 * PANEL_PADDING;
    UpdatePanelSize(this.panel.eid, size);
    this.panel.size = size;

    if (this.successResult) {
      this.clearButton.obj.position.copy(new Vector3(0, -((size[1] + clearSize[1]) / 2 + PANEL_PADDING), 0));

      this.clearButton.obj.updateMatrix();

      this.clearButton.obj.visible = true;
    } else {
      this.clearButton.obj.visible = false;
    }

    this.nextArrow.obj.position.copy(new Vector3((size[0] + arrowSize[0]) / 2 + PANEL_PADDING, 0, 0));
    this.prevArrow.obj.position.copy(new Vector3(-((size[0] + arrowSize[0]) / 2 + PANEL_PADDING), 0, 0));
    this.nextArrow.obj.updateMatrix();
    this.prevArrow.obj.updateMatrix();

    this.agentParent.obj.visible = true;
    this.panel.obj.visible = true;
  }

  UpdateTextArray(newTextArray) {
    this.textArray = newTextArray;
    this.slideIndex = 0;
    this.RenderSlide();
  }

  SegmentText(text) {
    const sentences = text.split("\n");
    return sentences.filter(sentence => {
      return sentence !== "" && sentence !== " ";
    });
  }
  NextSentence() {
    this.slideIndex += 1;
    this.nextArrow.obj.visible = this.slideIndex !== this.textArray.length - 1;
    this.RenderSlide();
  }

  PrevSentence() {
    this.slideIndex -= 1;
    this.prevArrow.obj.visible = this.slideIndex !== 0;
    this.RenderSlide();
  }

  RenderSlide() {
    this.nextArrow.obj.visible = this.slideIndex !== this.textArray.length - 1;
    this.prevArrow.obj.visible = this.slideIndex !== 0;
    this.displayedText.obj.text = this.textArray[this.slideIndex];
  }

  setMicStatus() {
    const permissionsGranted = APP.mediaDevicesManager.getPermissionsStatus("microphone") === PermissionStatus.GRANTED;
    const changedMicStatus = this.micStatus !== (permissionsGranted && APP.mediaDevicesManager.isMicEnabled);
    if (changedMicStatus) {
      this.micStatus = permissionsGranted && APP.mediaDevicesManager.isMicEnabled;
      if (this.micStatus && !this.waitingForResponse) {
        this.AskAgent();
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

    if (clicked(this.nextArrow.eid)) {
      this.NextSentence();
    }
    if (clicked(this.prevArrow.eid)) {
      this.PrevSentence();
    }
  }

  AddAnimationDots() {
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
    this.loadingObj.lookAt(avatarPos());
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
    this.loadingObj.lookAt(avatarPos());
    this.loadingObj.traverse(o => {
      if (o.material) o.material.opacity = (Math.sin(typingAnimTime / 150) + 1) / 2;
    });
  }

  async AskAgent() {
    this.panel.obj.visible = false;
    this.infoPanel.obj.visible = true;
    this.waitingForResponse = true;
    this.setMicStatus();

    const agentDataObj = [];
    let t1, t2;

    try {
      t1 = Date.now();
      const recordedQuestion = await RecordQuestion();
      t2 = Date.now();

      this.isProccessing = true;
      const sourceLang = translationSystem.mylanguage ? languageCodes[translationSystem.mylanguage] : "en";
      const nmtAudioParams = { source_language: sourceLang, target_language: "en", return_transcription: "true" };

      t1 = Date.now();
      const nmtResponse = await audioModules(
        COMPONENT_ENDPOINTS.TRANSLATE_AUDIO_FILES,
        recordedQuestion.data.file,
        nmtAudioParams
      );
      t2 = Date.now();
      agentDataObj.push({
        start_time: t1.toString(),
        stop_time: t2.toString(),
        source_language: translationSystem.mylanguage,
        target_language: "english",
        transcription: nmtResponse.data.transcriptions[0],
        translation: nmtResponse.data.translations[0]
      });

      t1 = Date.now();
      const intentResponse = await intentionModule(nmtResponse.data.translations[0]);
      t2 = Date.now();
      agentDataObj.push({
        start_time: t1.toString(),
        stop_time: t2.toString(),
        input: nmtResponse.data.translations[0],
        intent: intentResponse.data.intent,
        destination: intentResponse.data.destination
      });

      t1 = Date.now();
      const navigation = navSystem.GetInstructions(avatarPos(), intentResponse.data.destination);
      agentLogger.response.start = new Date();
      const response = await dsResponseModule(
        nmtResponse.data.translations[0],
        intentResponse.data.intent,
        navigation.knowledge
      );
      t2 = Date.now();
      agentDataObj.push({
        start_time: t1.toString(),
        stop_time: t2.toString(),
        instructions: navigation.instructions,
        knowledge: navigation.knowledge,
        ds_output: response.data.response
      });

      const targetLang = languageCodes[translationSystem.mylanguage];
      const nmtTextParams = { source_language: "en", target_language: targetLang };
      const outputArray = this.SegmentText(response.data.response);

      if (nmtTextParams.source_language === nmtTextParams.target_language) this.UpdateTextArray(outputArray);
      else {
        t1 = Date.now();
        const translatePromises = [];
        outputArray.forEach(sentence =>
          translatePromises.push(textModule(COMPONENT_ENDPOINTS.TRANSLATE_TEXT, sentence, nmtTextParams))
        );

        const translatedResponses = await Promise.all(translatePromises);
        console.log(translatePromises);
        const TranslatedOutputArray = translatedResponses.map(element => {
          return element.data.translations[0];
        });

        this.UpdateTextArray(TranslatedOutputArray);
        t2 = Date.now();
        agentDataObj.push({
          start_time: t1.toString(),
          stop_time: t2.toString(),
          source_language: "english",
          target_language: translationSystem.mylanguage,
          translated_text: TranslatedOutputArray.join("\n")
        });
      }

      const stringData = JSON.stringify(agentDataObj);
      const jsonDataBlob = new Blob([stringData], { type: "application/json" });
      // logger.AddAgentInteraction(recordedQuestion.data.file, jsonDataBlob);

      if (intentResponse.data.intent.includes("navigation") && navigation.valid) {
        this.successResult = true;
        navSystem.RenderCues(navigation);
      } else if (intentResponse.data.intent.includes("program_info")) {
        this.successResult = true;
      } else {
        this.successResult = false;
      }
    } catch (error) {
      console.log("error", error);
      this.UpdateWithRandomPhrase("error");
    } finally {
      this.isProccessing = false;
      this.infoPanel.obj.visible = false;

      this.setMicStatus();
      this.waitingForResponse = false;
    }
  }

  DatasetCreate() {
    const destNames = ["conference room", "business room", "social area", "booth 1", "booth 2", "booth 3", "booth 4"];
    destNames.forEach(destination =>
      console.log(
        `{"destination": "${destination}", "intent":"navigation", "mozilla_input":${
          navSystem.GetInstructions(avatarPos(), destination).knowledge
        }},`
      )
    );
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

    this.UpdateTextArray(phrases.length === 1 ? [phrases[0]] : [phrases.join(" ")]);
    this.currentOccasion = occasion;
  }

  GetTypingObj() {
    return typingObj;
  }

  get exists() {
    return !!this.agent.eid;
  }
}

export const virtualAgent = new VirtualAgent();
export const agentLogger = new Logger();

export function avatarPos() {
  const avatarPos = new THREE.Vector3();
  const avatarPovObj = document.querySelector("#avatar-pov-node").object3D;
  avatarPovObj.getWorldPosition(avatarPos);
  return avatarPos;
}

export function avatarDirection() {
  const avatarPovObj = document.querySelector("#avatar-pov-node").object3D;
  const playerForward = new THREE.Vector3();
  avatarPovObj.getWorldDirection(playerForward);
  return playerForward.multiplyScalar(-1);
}
