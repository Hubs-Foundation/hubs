import {
  addComponent,
  defineQuery,
  enterQuery,
  entityExists,
  exitQuery,
  hasComponent,
  removeComponent,
  removeEntity
} from "bitecs";
import { Agent, Hidden, Interacted, Object3DTag } from "../bit-components";
import { lowerIndex, raiseIndex } from "./agent-slideshow-system";
import { PermissionStatus } from "../utils/media-devices-utils";
import { stageUpdate } from "../systems/single-action-button-system";
import { developingRouter, nmtModule, routerModule, toggleRecording, vlModule } from "../utils/asr-adapter";
import { ASR, LANGUAGES, RECORDER_CODES, VL_TEXT, VL } from "../utils/ml-types";
import { addAgentToScene } from "../prefabs/agent";
import { SnapDepthPOV, SnapPOV } from "../utils/vlm-adapters";
import { sceneGraph } from "./routing-system";
import { renderAsEntity } from "../utils/jsx-entity";
import { NavigationLine } from "../prefabs/nav-line";
import { AxesHelper } from "three";

const agentQuery = defineQuery([Agent]);
const enterAgentQuery = enterQuery(agentQuery);

function clicked(eid) {
  return hasComponent(APP.world, Interacted, eid);
}

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function AgentSystem(world) {
  if (!virtualAgent.IsEntered() || virtualAgent.hidden) return;

  virtualAgent.MovementActions();

  virtualAgent.ButtonInteractions();

  virtualAgent.agentObj.updateMatrix();
}

const mode = {
  greeting: 0,
  idle: 1,
  listening: 2,
  navigation: 3
};

export default class VirtualAgent {
  constructor() {}

  Init() {
    addAgentToScene(APP.world);
    this.hidden = true;
    this.mode = mode.greeting;
    this.exists = false;
    APP.scene.addEventListener("agent-toggle", () => {
      if (this.hidden) {
        removeComponent(APP.world, Hidden, this.eid);
        this.hidden = false;
      } else {
        addComponent(APP.world, Hidden, this.eid);
        this.hidden = true;
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
      this.mode = mode.greeting;

      APP.dialog.on("mic-state-changed", () => this.setMicStatus());
      this.setMicStatus();

      APP.scene.emit("agent-toggle");

      this.scene.object3D.add(new AxesHelper());
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

  ButtonInteractions() {
    if (clicked(this.arrowNext)) raiseIndex();
    if (clicked(this.arrowPrev)) lowerIndex();
    if (clicked(this.buttonMic)) this.MicrophoneActions();
    if (clicked(this.buttonSnap)) {
      /*this.SnapActions();*/
      const dev = developingRouter();
      console.log(dev);
      this.Navigation(dev.data.start, dev.data.dest);
    }
  }

  MicrophoneActions() {
    const savefile = false;

    stageUpdate();
    toggleRecording(savefile)
      .then(result => {
        if (result.status.code === RECORDER_CODES.SUCCESSFUL) {
          nmtModule(result, LANGUAGES.SPANISH, ASR.TRANSCRIBE_AUDIO_FILES)
            .then(asrResult => {
              routerModule(asrResult)
                .then(routerResults => {
                  this.Navigation(routerResults.data.start, routerResults.data.dest);
                  // sceneGraph.Dijkstra(routerResults.data.start, routerResults.data.dest);
                  // console.log(sceneGraph.path);
                })
                .catch(routerError => {
                  console.log(routerError);
                });
            })
            .catch(asrError => {
              console.log(asrError);
            });
        }
      })
      .catch(error => {
        console.log(error);
      });
  }

  SnapActions() {
    Promise.all([SnapPOV(this.agentObj, false), SnapDepthPOV(false)])
      .then(values => {
        vlModule(values[0], VL.LXMERT)
          .then(snapResponse => {
            console.log(snapResponse);
          })
          .catch(snapError => {
            console.log(snapError);
          });
      })
      .catch(error => {
        console.log(error);
      });
  }

  HandleArrows(renderArrows) {
    APP.world.eid2obj.get(this.arrowNext).visible = renderArrows;
    APP.world.eid2obj.get(this.arrowPrev).visible = renderArrows;
  }

  ChangeMode(mode) {
    this.mode = mode;
  }

  Navigation(startIndex, endIndex) {
    if (this.cube !== undefined) {
      console.log("deleting previous arrows");
      removeEntity(APP.world, this.cube);
      this.scene.object3D.remove(this.arrowObjs);
    }
    const navigation = sceneGraph.GetInstructions(startIndex, endIndex);

    console.log("nodePath:", navigation.path);
    console.log("instructions", navigation.instructions);

    this.cube = renderAsEntity(APP.world, NavigationLine(navigation));
    this.arrowObjs = APP.world.eid2obj.get(this.cube);
    this.scene.object3D.add(this.arrowObjs);
  }

  AgentPos() {
    return this.agentObj.getWorldPosition(new THREE.Vector3());
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
