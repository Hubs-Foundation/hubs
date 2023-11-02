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
  virtualAgent.agentObj.updateMatrix();
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
        removeComponent(APP.world, Hidden, this.eid);
        APP.scene.addState("agent");
        this.hidden = false;
      } else {
        APP.scene.removeState("agent");
        this.hidden = true;
        addComponent(APP.world, Hidden, this.eid);
      }
    });
  }

  IsEntered() {
    enterAgentQuery(APP.world).forEach(agentEid => {
      this.eid = agentEid;
      this.arrowNext = Agent.nextRef[this.eid];
      this.arrowPrev = Agent.prevRef[this.eid];
      this.buttonMic = Agent.micRef[this.eid];
      this.buttonMicObj = APP.world.eid2obj.get(this.buttonMic);
      this.buttonSnap = Agent.snapRef[this.eid];
      this.agentObj = APP.world.eid2obj.get(this.eid);
      this.panelObj = APP.world.eid2obj.get(Agent.panelRef[this.eid]);
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

    if (this.eid) return true;
    else return false;
  }

  setMicStatus() {
    const permissionsGranted = APP.mediaDevicesManager.getPermissionsStatus("microphone") === PermissionStatus.GRANTED;
    const isMicNotDisabled = APP.mediaDevicesManager.isMicEnabled !== false;
    this.buttonMicObj.visible = permissionsGranted && isMicNotDisabled;
  }

  MovementActions() {
    const agentPos = this.agentObj.getWorldPosition(new THREE.Vector3());
    const avatarPos = this.avatarPovObj.getWorldPosition(new THREE.Vector3());
    const dist = agentPos.distanceTo(avatarPos);

    if (dist > 2) {
      const dir = new THREE.Vector3().subVectors(avatarPos, agentPos).normalize();
      const newPos = new THREE.Vector3().copy(avatarPos.sub(dir.multiplyScalar(2)));
      this.agentObj.position.copy(newPos);
    }

    if (dist < 0.3) {
      this.agentObj.visible = false;
    } else {
      this.agentObj.visible = true;
    }
  }

  async ButtonInteractions() {
    if (clicked(this.arrowNext)) raiseIndex();
    if (clicked(this.arrowPrev)) lowerIndex();
    if (clicked(this.buttonMic)) this.MicrophoneActions();
    if (clicked(this.buttonSnap))
      await this.Navigate("conference room", "how can i go to the conference room?", "navigation");
  }

  async MicrophoneActions(savefile) {
    stageUpdate();
    try {
      const toggleResponse = await toggleRecording(savefile);

      if (toggleResponse.status.code === COMPONENT_CODES.Successful) {
        const nmtParameters = { source_language: "en", target_language: "en", return_transcription: "true" };
        const nmtResponse = await audioModules(
          COMPONENT_ENDPOINTS.TRANSLATE_AUDIO_FILES,
          toggleResponse.data.file,
          nmtParameters
        );
        console.log("nmtResponse", nmtResponse);

        const intentResponse = await intentionModule(nmtResponse.data.translations[0]);
        console.log("intentResponse", intentResponse);

        if (intentResponse.data.intent === "navigation") {
          const destName = intentResponse.data.destination;
          await this.Navigate(destName, nmtResponse.data.translations[0], intentResponse.data.intent);
        }
      }
    } catch (error) {
      console.log("error", error);
    }
  }

  async Navigate(destName, userQuery, userIntent) {
    const startIndex = sceneGraph.GetClosestIndex(virtualAgent.AvatarPos());
    const navigation = sceneGraph.GetInstructions(startIndex, destName);
    try {
      const knowledge = await knowledgeModule(userQuery, userIntent, navigation.instructions);
      UpdateTextSystem(APP.world, knowledge.data.response);
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
      const responses = await Promise.all([SnapPOV(this.agentObj, false), SnapDepthPOV(false)]);
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
    APP.world.eid2obj.get(this.arrowNext).visible = renderArrows;
    APP.world.eid2obj.get(this.arrowPrev).visible = renderArrows;
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
