import { defineQuery, enterQuery } from "bitecs";
import { Agent } from "../bit-components";
import { Object3D } from "three";
import { number } from "prop-types";
import { AElement, AScene } from "aframe";
import { roomPropertiesReader } from "../utils/rooms-properties";
import { renderAsEntity } from "../utils/jsx-entity";
import { AgentEntity } from "../prefabs/agent";
import { Text } from "troika-three-text";
import { RecordQuestion, audioModules, dsResponseModule, intentionModule } from "../utils/ml-adapters";
import { translationSystem } from "./translation-system";
import { COMPONENT_ENDPOINTS } from "../utils/component-types";
import { navSystem } from "./routing-system";

const agentQuery = defineQuery([Agent]);
const enterAgentQuery = enterQuery(agentQuery);
const PANEL_PADDING = 0.05;
const SKIP_MODULE = false;

const OUTPUT1 =
  "To reach the social space, follow these steps:\n- Start by moving forward 4 meters.\n- Turn left and proceed for 11 meters.\n- Turn right and move 4 meters.\n- Turn left and go 3 meters.\n- Take the stairs up.\n- Move 12 meters.\n- Turn right again and move 4 meters.\n- Turn right once more and go 13 meters.\n- Finally, turn left and move forward 5 meters.\n\nYou should now be in the social space.";
const OUTPUT2 =
  "To find the bathroom, follow these steps:\n- Start by turning right.\n- Move forward 2 meters.\n- Turn left and go 16 meters.\n- Turn right and proceed for 6 meters.\n- Turn left and move 1 meter.\n\nYou should now be at the bathroom.";
const OUTPUT3 =
  "To reach the garden, follow these steps:\n- Start by turning right.\n- Move forward 1 meter.\n- Turn left and go 17 meters.\n- Turn left again and proceed for 6 meters.\n- Turn right and move forward.\n\nYou should now be at the garden.";

const TEST_OUTPUTS = [OUTPUT1, OUTPUT2, OUTPUT3];

export class objElement {
  eid: number;
  obj: Object3D;
  size: number;

  Update(eid: number) {
    this.eid = eid;
    this.obj = APP.world.eid2obj.get(eid)!;
  }
}

class textElement extends objElement {
  value: string;
  constructor() {
    super();
  }
}

export default class DialogueAgent {
  agent: objElement;
  nextButton: objElement;
  prevButton: objElement;
  infoPanel: objElement;
  clearButton: objElement;
  agentParent: objElement;
  panel: objElement;

  displayedText: textElement;

  avatarPov: Object3D;
  loadingObj: Object3D;

  allowed: boolean;
  isMicAvailable: boolean;

  agentStatus: "listening" | "proccessing" | "result" | "ready" | "away";

  Ascene: AScene;

  Init(reset: boolean) {
    if (reset) {
      // APP.scene!.removeEventListener("agent-toggle", this.onToggle);
      // APP.scene!.removeEventListener("clear-scene", this.onClear);
    }

    this.avatarPov = (document.querySelector("#avatar-pov-node") as AElement).object3D;
    this.allowed = roomPropertiesReader.AllowsAgent;

    if (!this.allowed) {
      console.warn("Virtual Agent is not enabled in this room");
      return;
    }

    // APP.scene!.addEventListener("agent-toggle", this.onToggle);
    // APP.scene!.addEventListener("clear-scene", this.onClear);

    this.Ascene = APP.scene! as AScene;
  }

  Instantiate() {
    this.Ascene.addState("agent");
    const parentRef = renderAsEntity(APP.world, AgentEntity());
    const parentObj = APP.world.eid2obj.get(parentRef)!;

    this.agentParent.eid = parentRef;
    this.agentParent.obj = parentObj;
  }

  onEnter(agentRef: number) {
    this.agent.Update(agentRef);
    this.nextButton.Update(Agent.nextRef[agentRef]);
    this.prevButton.Update(Agent.prevRef[agentRef]);
    this.infoPanel.Update(Agent.micRef[agentRef]);
    this.clearButton.Update(Agent.navRef[agentRef]);
    this.panel.Update(Agent.panelRef[agentRef]);
    this.displayedText.Update(Agent.textRef[agentRef]);

    this.isMicAvailable = false;
    // APP.dialog.on("mic-state-changed", this.setMicStatus);
    APP.mediaDevicesManager!.micEnabled = false;

    // this.displayedText.obj.addEventListener("synccomplete", this.OntextUpdate);
    // this.Ascene.addEventListener("language_updated", this.onLanguageUpdated);

    this.CreateDotPanel();
    // this.UpdateWithRandomPhrase("greetings");
    this.agent.obj.visible = true;
    this.infoPanel.obj.visible = false;
    this.agentStatus = "ready";
  }

  CreateDotPanel() {
    (this.infoPanel.obj.children[0] as Text).text = "";

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

  async AskAgent() {
    this.panel.obj.visible = false;
    this.infoPanel.obj.visible = false;
    this.agentStatus = "listening";
    const recordedQuestion = await RecordQuestion(false);

    this.agentStatus = "proccessing";

    const sourceLang = translationSystem.mylanguage;
    const nmtAudioParams = { source_language: sourceLang, target_language: "en", return_transcription: "true" };

    const nmtResponse = await audioModules(
      COMPONENT_ENDPOINTS.TRANSLATE_AUDIO_FILES,
      recordedQuestion.data.file,
      nmtAudioParams
    )!;

    const translation = nmtResponse.data!.translations![0];

    const intentResponse = (await intentionModule(translation)!).data!;
    const destination = intentResponse.destination!;
    const intention = intentResponse.intent!;
    const navigation = navSystem.GetInstructions(this.avatarPos, destination);

    const response = await dsResponseModule(translation, intention, navigation.knowledge);

    let output: string;
    if (translationSystem.mylanguage === "en") output = response.data!.response!;
  }

  get avatarPos() {
    const avatarPos = new THREE.Vector3();
    this.avatarPov.getWorldPosition(avatarPos);
    return avatarPos;
  }
}
