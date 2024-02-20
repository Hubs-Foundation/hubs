import { addComponent, defineQuery, hasComponent, removeComponent } from "bitecs";
import {
  HoverButton,
  HoveredHandLeft,
  HoveredHandRight,
  HoveredRemoteLeft,
  HoveredRemoteRight,
  IconButton,
  Interacted,
  SingleActionButton,
  TextButton
} from "../bit-components";
import { BUTTON_TYPES } from "../prefabs/button3D";
import { hasAnyComponent } from "../utils/bit-utils";
import { getThemeColor, onThemeChanged } from "../utils/theme";
import { CAMERA_MODE_INSPECT } from "./camera-system";
import { paths } from "./userinput/paths";
import { startRecButtonTexture, stopRecButtonTexture } from "../prefabs/icon-button";
import { isRecording } from "../utils/ml-adapters";

function interact(world, entities, path, interactor) {
  if (AFRAME.scenes[0].systems.userinput.get(path)) {
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      addComponent(world, Interacted, eid);

      // TODO: New systems should not listen for this event
      // Delete this when we're done interoping with old world systems
      world.eid2obj.get(eid).dispatchEvent({
        type: "interact",
        object3D: interactor
      });
    }
  }
}

const interactedQuery = defineQuery([Interacted]);
const rightRemoteQuery = defineQuery([SingleActionButton, HoveredRemoteRight]);
const leftRemoteQuery = defineQuery([SingleActionButton, HoveredRemoteLeft]);
const recMaterial = new THREE.MeshBasicMaterial({ map: startRecButtonTexture, transparent: true, toneMapped: false });
const stopMaterial = new THREE.MeshBasicMaterial({ map: stopRecButtonTexture, transparent: true, toneMapped: false });

let updateMicButton = false;
let shouldChange = false;

export function stageUpdate() {
  updateMicButton = true;
}

function singleActionButtonSystem(world) {
  // Clear the interactions from previous frames
  const interactedEnts = interactedQuery(world);
  for (let i = 0; i < interactedEnts.length; i++) {
    const eid = interactedEnts[i];
    removeComponent(world, Interacted, eid);
  }

  if (AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.mode === CAMERA_MODE_INSPECT) {
    // TODO: Fix issue where button objects are "visible" but not on the inspect layer,
    // which makes it so we can interact with them but cannot see them.
    return;
  }

  const interactorSettings = AFRAME.scenes[0].systems.interaction.options;
  interact(
    world,
    leftRemoteQuery(world),
    paths.actions.cursor.left.grab,
    interactorSettings.leftRemote.entity.object3D
  );
  interact(
    world,
    rightRemoteQuery(world),
    paths.actions.cursor.right.grab,
    interactorSettings.rightRemote.entity.object3D
  );
}

const buttonStyles = {};
// TODO these colors come from what we are doing in theme.js for aframe mixins but they seem fishy
function applyTheme() {
  buttonStyles[BUTTON_TYPES.DEFAULT] = {
    color: new THREE.Color(0xffffff),
    hoverColor: new THREE.Color(0xaaaaaa),
    textColor: new THREE.Color(getThemeColor("action-color")),
    textHoverColor: new THREE.Color(getThemeColor("action-color-highlight"))
  };
  buttonStyles[BUTTON_TYPES.ACTION] = {
    color: new THREE.Color(getThemeColor("action-color")),
    hoverColor: new THREE.Color(getThemeColor("action-color-highlight")),
    textColor: new THREE.Color(0xffffff),
    textHoverColor: new THREE.Color(0xffffff)
  };
  buttonStyles[BUTTON_TYPES.MIC] = {
    color: new THREE.Color(0xffffff),
    hoverColor: new THREE.Color(0xaaaaaa),
    iconColor: new THREE.Color(0xd6362b),
    iconHoverColor: new THREE.Color(getThemeColor("action-color-highlight"))
  };
  buttonStyles[BUTTON_TYPES.CAMERA] = {
    color: new THREE.Color(0xffffff),
    hoverColor: new THREE.Color(0xaaaaaa),
    iconColor: new THREE.Color(getThemeColor("action-color")),
    iconHoverColor: new THREE.Color(getThemeColor("action-color-highlight"))
  };
}
onThemeChanged(applyTheme);
applyTheme();

const hoverComponents = [HoveredRemoteRight, HoveredRemoteLeft, HoveredHandRight, HoveredHandLeft];

const hoverButtonsQuery = defineQuery([HoverButton]);
function hoverButtonSystem(world) {
  hoverButtonsQuery(world).forEach(function (eid) {
    if (HoverButton.type[eid] == BUTTON_TYPES.MIC)
      if (updateMicButton) {
        changeColor();
        shouldChange = true;
      }

    const obj = world.eid2obj.get(eid);
    const isHovered = hasAnyComponent(world, hoverComponents, eid);
    const style = buttonStyles[HoverButton.type[eid]];

    if (obj.material.color) {
      obj.material.color.copy(isHovered ? style.hoverColor : style.color);
    }

    if (hasComponent(world, TextButton, eid)) {
      const lbl = world.eid2obj.get(TextButton.labelRef[eid]);
      lbl.color = isHovered ? style.textHoverColor : style.textColor;
    }

    if (hasComponent(world, IconButton, eid)) {
      const lbl = world.eid2obj.get(IconButton.labelRef[eid]);
      if (shouldChange) changeShape(lbl);
      lbl.material.color.copy(isHovered ? style.iconHoverColor : style.iconColor);
    }
  });
}

export function buttonSystems(world) {
  hoverButtonSystem(world);
  singleActionButtonSystem(world);
}

function changeColor() {
  if (isRecording) {
    buttonStyles[BUTTON_TYPES.MIC].iconColor = new THREE.Color(getThemeColor("action-color"));
  } else {
    buttonStyles[BUTTON_TYPES.MIC].iconColor = new THREE.Color(0xd6362b);
  }
}

function changeShape(obj) {
  if (isRecording) {
    obj.material = stopMaterial;
  } else {
    obj.material = recMaterial;
  }
  updateMicButton = false;
  shouldChange = false;
}
