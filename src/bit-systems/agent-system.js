import { addComponent, defineQuery, enterQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { Agent, Hidden, Interacted } from "../bit-components";
import { UpdateTextSystem, lowerIndex, raiseIndex } from "./agent-slideshow-system";
import { PermissionStatus } from "../utils/media-devices-utils";
import { stageUpdate } from "../systems/single-action-button-system";
import { audioModules, intentionModule, dsResponseModule, toggleRecording, vlModule } from "../utils/asr-adapter";
import { COMPONENT_ENDPOINTS, COMPONENT_CODES } from "../utils/component-types";
import { AgentEntity, addAgentToScene, addLangPanelToScene } from "../prefabs/agent";
import { SnapDepthPOV, SnapPOV } from "../utils/vlm-adapters";
import { navSystem } from "./routing-system";
import { renderAsEntity } from "../utils/jsx-entity";
import { NavigationCues, pivotPoint } from "../prefabs/nav-line";
import { languageCodes, subtitleSystem } from "./subtitling-system";
import UpdateTextPanel from "../utils/interactive-panels";
import { Vector3 } from "three";

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

export default class VirtualAgent {
  constructor() {
    this.allowed = null;

    this.agent = new objElement();
    this.nextArrow = new objElement();
    this.prevArrow = new objElement();
    this.micButton = new objElement();
    this.snapButton = new objElement();
    this.panel = new objElement();
    this.text = new objElement();

    this.onClear = this.onClear.bind(this);
    this.onToggle = this.onToggle.bind(this);
    this.setMicStatus = this.setMicStatus.bind(this);
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

    this.UpdateText("Hello I am your personal Agent");
    APP.dialog.on("mic-state-changed", this.setMicStatus);
    this.setMicStatus();
    this.agent.obj.visible = true;
  }

  Cleanup() {
    this.agent.update(null);
    this.nextArrow.update(null);
    this.prevArrow.update(null);
    this.micButton.update(null);
    this.snapButton.update(null);
    this.panel.update(null);
    this.text.update(null);
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

  UpdateText(text) {
    UpdateTextPanel(text, this.text.obj, this.panel.eid, false, true);
  }

  setMicStatus() {
    const permissionsGranted = APP.mediaDevicesManager.getPermissionsStatus("microphone") === PermissionStatus.GRANTED;
    const isMicNotDisabled = APP.mediaDevicesManager.isMicEnabled !== false;
    this.micButton.obj.visible = permissionsGranted && isMicNotDisabled;
  }

  async ButtonInteractions() {
    if (clicked(this.micButton.eid)) this.MicrophoneActions(false);
  }

  async MicrophoneActions(savefile) {
    stageUpdate();
    try {
      const toggleResponse = await toggleRecording(savefile);

      if (toggleResponse.status.code === COMPONENT_CODES.Successful) {
        const sourceLang = subtitleSystem.mylanguage ? languageCodes[subtitleSystem.mylanguage] : "en";
        const nmtParameters = { source_language: sourceLang, target_language: "en", return_transcription: "true" };

        const nmtResponse = await audioModules(
          COMPONENT_ENDPOINTS.TRANSLATE_AUDIO_FILES,
          toggleResponse.data.file,
          nmtParameters
        );

        const intentResponse = await intentionModule(nmtResponse.data.translations[0]);
        const navigation = navSystem.GetInstructions(this.avatarPos, intentResponse.data.destination);

        const response = await dsResponseModule(
          nmtResponse.data.translations[0],
          intentResponse.data.intent,
          navigation.knowledge
        );

        this.UpdateText(response.data.response);
        navSystem.RenderCues();
      }
    } catch (error) {
      console.log("error", error);
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

  get exists() {
    return !!this.agent.eid;
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
