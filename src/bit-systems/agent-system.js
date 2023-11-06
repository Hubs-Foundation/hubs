import { addComponent, defineQuery, enterQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { Agent, Hidden, Interacted } from "../bit-components";
import { UpdateTextSystem, lowerIndex, raiseIndex } from "./agent-slideshow-system";
import { PermissionStatus } from "../utils/media-devices-utils";
import { stageUpdate } from "../systems/single-action-button-system";
import { audioModules, intentionModule, knowledgeModule, toggleRecording, vlModule } from "../utils/asr-adapter";
import { COMPONENT_ENDPOINTS, COMPONENT_CODES } from "../utils/component-types";
import { addAgentToScene } from "../prefabs/agent";
import { SnapDepthPOV, SnapPOV } from "../utils/vlm-adapters";
import { sceneGraph } from "./routing-system";
import { renderAsEntity } from "../utils/jsx-entity";
import { NavigationLine, pivotPoint } from "../prefabs/nav-line";
import { AxesHelper } from "three";
import { subtitleSystem } from "./subtitling-system";
import UpdateTextPanel from "../utils/interactive-panels";

const agentQuery = defineQuery([Agent]);
const enterAgentQuery = enterQuery(agentQuery);

function clicked(eid) {
  return hasComponent(APP.world, Interacted, eid);
}

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function AgentSystem() {
  if (!virtualAgent.IsEntered() || virtualAgent.hidden) return;

  virtualAgent.MovementActions();
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
    addAgentToScene(APP.world);
    this.hidden = true;
    this.exists = false;
    APP.scene.addEventListener("agent-toggle", () => {
      if (this.hidden) {
        if (APP.scene.is("map")) {
          APP.scene.emit("map-toggle");
        }
        removeComponent(APP.world, Hidden, this.agent.eid);
        APP.scene.addState("agent");
        this.hidden = false;
      } else {
        APP.scene.removeState("agent");
        this.hidden = true;
        addComponent(APP.world, Hidden, this.agent.eid);
      }
    });
  }

  IsEntered() {
    enterAgentQuery(APP.world).forEach(agentEid => {
      this.agent = new AgentElement(agentEid);
      console.log("agent", this.agent);
      this.nextArrow = new AgentElement(Agent.nextRef[agentEid]);
      this.prevArrow = new AgentElement(Agent.prevRef[agentEid]);
      this.micButton = new AgentElement(Agent.micRef[agentEid]);
      this.snapButton = new AgentElement(Agent.snapRef[agentEid]);
      this.panel = new AgentElement(Agent.panelRef[agentEid]);
      this.text = new AgentElement(Agent.textRef[agentEid]);

      this.scene = AFRAME.scenes[0];
      this.camera = this.scene.camera;
      this.renderer = this.scene.renderer;
      this.avatarPovObj = document.querySelector("#avatar-pov-node").object3D;

      APP.dialog.on("mic-state-changed", () => this.setMicStatus());
      this.setMicStatus();

      APP.scene.emit("agent-toggle");

      this.scene.object3D.add(new AxesHelper());

      const showPivots = false; //Change this to see points

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
    });

    if (this.agent) return true;
    else return false;
  }

  setMicStatus() {
    const permissionsGranted = APP.mediaDevicesManager.getPermissionsStatus("microphone") === PermissionStatus.GRANTED;
    const isMicNotDisabled = APP.mediaDevicesManager.isMicEnabled !== false;
    this.micButton.obj.visible = permissionsGranted && isMicNotDisabled;
  }

  MovementActions() {
    const agentPos = this.agent.obj.getWorldPosition(new THREE.Vector3());
    const avatarPos = this.avatarPovObj.getWorldPosition(new THREE.Vector3());
    const dist = agentPos.distanceTo(avatarPos);

    if (dist > 2) {
      const dir = new THREE.Vector3().subVectors(avatarPos, agentPos).normalize();
      const newPos = new THREE.Vector3().copy(avatarPos.sub(dir.multiplyScalar(2)));
      this.agent.obj.position.copy(newPos);
    }

    if (dist < 0.3) {
      this.agent.obj.visible = false;
    } else {
      this.agent.obj.visible = true;
    }
  }

  async ButtonInteractions() {
    if (clicked(this.nextArrowagent.eid)) raiseIndex();
    if (clicked(this.prevArrowagent.eid)) lowerIndex();
    if (clicked(this.micButtonagent.eid)) this.MicrophoneActions();
    if (clicked(this.buttonSnapagent.eid))
      await this.Navigate("conference room", "how can i go to the conference room?", "navigation");
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
      const startIndex = sceneGraph.GetClosestIndex(virtualAgent.AvatarPos());
      const navigation = sceneGraph.GetInstructions(startIndex, destName);
      const knowledge = await knowledgeModule(userQuery, userIntent, navigation.knowledge);
      // UpdateTextSystem(APP.world, knowledge.data.response);
      UpdateTextPanel(navigation.knowledge, this.text.obj, this.panel.eid);
      return knowledge;
    } catch (error) {
      console.log(error);
    }

    if (this.cube !== undefined) {
      removeEntity(APP.world, this.cube);
      this.scene.object3D.remove(this.arrowObjs);
    }
    this.cube = renderAsEntity(APP.world, NavigationLine(navigation));
    this.arrowObjs = APP.world.eid2obj.get(this.cube);
    this.scene.object3D.add(this.arrowObjs);
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

  GetRandomDest() {
    const targetNames = Object.keys(sceneGraph.targetInfo);
    const randomKeyIndex = Math.floor(Math.random() * targetNames.length);
    const destName = targetNames[randomKeyIndex];
    return destName;
  }

  HandleArrows(renderArrows) {
    this.nextArrow.obj.visible = renderArrows;
    this.prevArrow.obj.visible = renderArrows;
  }

  AvatarPos() {
    return this.avatarPovObj.getWorldPosition(new THREE.Vector3());
  }

  AvatarDirection() {
    const playerForward = new THREE.Vector3();
    this.avatarPovObj.getWorldDirection(playerForward);

    return playerForward.multiplyScalar(-1);
  }
}

export const virtualAgent = new VirtualAgent();
