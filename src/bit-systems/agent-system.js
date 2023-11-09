import { addComponent, defineQuery, enterQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { Agent, Hidden, Interacted } from "../bit-components";
import { UpdateTextSystem, lowerIndex, raiseIndex } from "./agent-slideshow-system";
import { PermissionStatus } from "../utils/media-devices-utils";
import { stageUpdate } from "../systems/single-action-button-system";
import { audioModules, intentionModule, knowledgeModule, toggleRecording, vlModule } from "../utils/asr-adapter";
import { COMPONENT_ENDPOINTS, COMPONENT_CODES } from "../utils/component-types";
import { addAgentToScene, addLangPanelToScene } from "../prefabs/agent";
import { SnapDepthPOV, SnapPOV } from "../utils/vlm-adapters";
import { sceneGraph } from "./routing-system";
import { renderAsEntity } from "../utils/jsx-entity";
import { NavigationLine, pivotPoint } from "../prefabs/nav-line";
import { subtitleSystem } from "./subtitling-system";
import UpdateTextPanel from "../utils/interactive-panels";
import { Vector3 } from "three";

const agentQuery = defineQuery([Agent]);
const enterAgentQuery = enterQuery(agentQuery);

function clicked(eid) {
  return hasComponent(APP.world, Interacted, eid);
}

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function AgentSystem() {
  enterAgentQuery(APP.world).forEach(eid => {
    virtualAgent.Enter(eid, false);
  });

  if (!virtualAgent.active) return;

  virtualAgent.ButtonInteractions();
  virtualAgent.agent.obj.updateMatrix();
}

class AgentElement {
  constructor(eid) {
    this.eid = eid;
    this.obj = APP.world.eid2obj.get(eid);
  }
}

export default class VirtualAgent {
  constructor() {}

  Init() {
    this.avatarPovObj = document.querySelector("#avatar-pov-node").object3D;
    addAgentToScene(APP.world, this.avatarPovObj);
    APP.scene.addEventListener("agent-toggle", () => {
      if (!APP.scene.is("agent")) {
        if (APP.scene.is("map")) APP.scene.emit("map-toggle");
        this.Reset();
      } else {
        APP.scene.removeState("agent");
        this.agent.obj.visible = false;
      }
      this.active = APP.scene.is("agent");
    });
    APP.scene.addEventListener("lang-toggle", () => {
      if (!APP.scene.is("lang-panel")) {
        this.LangPanelEid = addLangPanelToScene(APP.world);
        APP.scene.addState("lang-panel");
      } else {
        if (this.LangPanelEid) {
          APP.scene.remove(APP.world.eid2obj.get(this.LangPanelEid));
          removeEntity(APP.world, this.LangPanelEid);
        }
        APP.scene.removeState("lang-panel");
      }
      this.active = APP.scene.is("lang-panel");
    });
  }

  Enter(agentEid, showPivots) {
    this.agent = new AgentElement(agentEid);
    this.nextArrow = new AgentElement(Agent.nextRef[agentEid]);
    this.prevArrow = new AgentElement(Agent.prevRef[agentEid]);
    this.micButton = new AgentElement(Agent.micRef[agentEid]);
    this.snapButton = new AgentElement(Agent.snapRef[agentEid]);
    this.panel = new AgentElement(Agent.panelRef[agentEid]);
    this.text = new AgentElement(Agent.textRef[agentEid]);

    this.scene = AFRAME.scenes[0];
    this.camera = this.scene.camera;
    this.renderer = this.scene.renderer;
    this.updateText = text => {
      UpdateTextPanel(text, this.text.obj, this.panel.eid, false, true);
    };

    APP.dialog.on("mic-state-changed", () => this.setMicStatus());
    this.setMicStatus();
    APP.scene.emit("agent-toggle");

    if (showPivots) {
      const pointEid = renderAsEntity(APP.world, pivotPoint(sceneGraph.nodes));
      const pivotObjs = APP.world.eid2obj.get(pointEid);
      this.scene.object3D.add(pivotObjs);
      console.log(sceneGraph.nodes);
      console.log(sceneGraph.edges);

      sceneGraph.nodes.forEach(node => {
        if (node.x === 2 && node.z > 29) console.log(node);
      });
    }

    if (this.agent) return true;
    else return false;
  }

  setMicStatus() {
    const permissionsGranted = APP.mediaDevicesManager.getPermissionsStatus("microphone") === PermissionStatus.GRANTED;
    const isMicNotDisabled = APP.mediaDevicesManager.isMicEnabled !== false;
    this.micButton.obj.visible = permissionsGranted && isMicNotDisabled;
  }

  async ButtonInteractions() {
    if (clicked(this.micButton.eid)) this.MicrophoneActions();
  }

  async MicrophoneActions(savefile) {
    stageUpdate();
    try {
      const toggleResponse = await toggleRecording(savefile);

      if (toggleResponse.status.code === COMPONENT_CODES.Successful) {
        const sourceLang = subtitleSystem.targetLanguage ? subtitleSystem.targetLanguage : "en";
        const nmtParameters = { source_language: sourceLang, target_language: "en", return_transcription: "true" };
        let t11, t12, t21, t22, t31, t32, elapsedTime1, elapsedTime2, elapsedTime3, knowledgeRespone;
        t11 = performance.now();
        const nmtResponse = await audioModules(
          COMPONENT_ENDPOINTS.TRANSLATE_AUDIO_FILES,
          toggleResponse.data.file,
          nmtParameters
        );
        t12 = performance.now();
        elapsedTime1 = t12 - t11;

        t21 = performance.now();
        const intentResponse = await intentionModule(nmtResponse.data.translations[0]);
        t22 = performance.now();
        elapsedTime2 = t22 - t21;

        if (intentResponse.data.intent === "navigation") {
          const destName = intentResponse.data.destination;

          t31 = performance.now();
          knowledgeRespone = await this.Navigate(
            destName,
            nmtResponse.data.translations[0],
            intentResponse.data.intent
          );
          t32 = performance.now();
          elapsedTime3 = t32 - t31;
        }

        const log = `NMT: {Query: "${nmtResponse.data.translations[0]}", Time: ${elapsedTime1}ms}\n
        Intent: {Intent: ${intentResponse.data.intent}, Destination: ${intentResponse.data.destination}, Time: ${elapsedTime2}ms}\n
        Response: {Knowledege: "${knowledgeRespone.data.response}", Time: ${elapsedTime3}ms}`;

        console.log(log);
      }
    } catch (error) {
      console.log("error", error);
    }
  }

  async Navigate(destName, userQuery, userIntent) {
    try {
      const startIndex = sceneGraph.GetClosestIndex(virtualAgent.avatarPos);
      const navigation = sceneGraph.GetInstructions(startIndex, destName);
      const knowledge = await knowledgeModule(userQuery, userIntent, navigation.knowledge);
      this.updateText(knowledge.data.response);
      if (this.cube !== undefined) {
        removeEntity(APP.world, this.cube);
        this.scene.object3D.remove(this.arrowObjs);
      }
      this.cube = renderAsEntity(APP.world, NavigationLine(navigation));
      this.arrowObjs = APP.world.eid2obj.get(this.cube);
      this.scene.object3D.add(this.arrowObjs);
      return knowledge;
    } catch (error) {
      console.log(error);
    }
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

  Reset() {
    const initialPosition = new THREE.Vector3(0.2, 0, -1);
    const initialRotation = new THREE.Euler(0, 0, 0, "XYZ");
    this.agent.obj.position.copy(initialPosition);
    this.agent.obj.rotation.copy(initialRotation);
    this.scene.addState("agent");
    this.agent.obj.visible = true;
    this.updateText("Hello I am your personal Agent");
    this.agent.obj.updateMatrixWorld();
  }

  get avatarDirection() {
    const playerForward = new THREE.Vector3();
    this.avatarPovObj.getWorldDirection(playerForward);
    return playerForward.multiplyScalar(-1);
  }

  get avatarPos() {
    return this.avatarPovObj.getWorldPosition(new THREE.Vector3());
  }

  get flatAvatarDirection() {
    return virtualAgent.avatarDirection.setY(0).normalize();
  }
}

export const virtualAgent = new VirtualAgent();
