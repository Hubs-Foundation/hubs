import _ from "underscore";

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Raw Device Input
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function tryGetRightOculusTouchGamepad() {
  const gamepads = navigator.getGamepads();
  for (var i = 0; i < gamepads.length; i++) {
    const gamepad = gamepads[i];
    if (gamepad.id === "Oculus Touch (Right)") {
      return gamepad;
    }
  }
  return null;
}

const RightOculusTouchSourceNames = [
  "a_touch",
  "a",
  "b_touch",
  "b",
  "stick_touch",
  "stick",
  "trigger_touch",
  "grip_touch",
  "stick_up_down",
  "stick_left_right",
  "trigger",
  "grip",
  "face_touch",
  "position",
  "orientation",
  "linearVelocity",
  "linearAcceleration",
  "angularVelocity",
  "angularAcceleration"
];

function pollRightOculusTouchInput(gamepad, frame) {
  const axes = gamepad.axes;
  const buttons = gamepad.buttons;
  const pose = gamepad.pose;
  frame.stick_touch = buttons[0].touched;
  frame.stick = buttons[0].pressed;
  frame.stick_left_right = axes[0];
  frame.stick_up_down = axes[1];
  frame.trigger = buttons[1].value;
  frame.trigger_touch = buttons[1].touched;
  frame.a = buttons[3].pressed; // WRONG - NOT BUTTON 3?
  frame.a_touch = buttons[3].touched;
  frame.b = buttons[4].pressed;
  frame.b_touch = buttons[4].touched;
  frame.grip_touch = buttons[2].touched;
  frame.grip = buttons[2].value;
  frame.face_touch = buttons[5].touched;
  frame.hasPosition = pose.hasPosition;
  frame.hasOrientation = pose.hasOrientation;
  if (pose.hasPosition && pose.position !== null) {
    frame.position[0] = pose.position[0];
    frame.position[1] = pose.position[1] + 1.6;
    // three.js applies device.stageParameters.sittingToStandingTransform to poses (including the vr camera)
    // if it exists, and a vertical translation if it doesn't. Here I just add a vertical translation to get around
    // dealing with this issue correctly.
    frame.position[2] = pose.position[2];
    frame.linearVelocity[0] = pose.linearVelocity[0];
    frame.linearVelocity[1] = pose.linearVelocity[1];
    frame.linearVelocity[2] = pose.linearVelocity[2];
    frame.linearAcceleration[0] = pose.linearAcceleration[0];
    frame.linearAcceleration[1] = pose.linearAcceleration[1];
    frame.linearAcceleration[2] = pose.linearAcceleration[2];
  }
  if (pose.hasOrientation && pose.orientation !== null) {
    frame.orientation[0] = pose.orientation[0];
    frame.orientation[1] = pose.orientation[1];
    frame.orientation[2] = pose.orientation[2];
    frame.orientation[3] = pose.orientation[3];
    frame.angularVelocity[0] = pose.angularVelocity[0];
    frame.angularVelocity[1] = pose.angularVelocity[1];
    frame.angularVelocity[2] = pose.angularVelocity[2];
    frame.angularAcceleration[0] = pose.angularAcceleration[0];
    frame.angularAcceleration[1] = pose.angularAcceleration[1];
    frame.angularAcceleration[2] = pose.angularAcceleration[2];
  }
}

function createRightOculusTouchInputFrame() {
  return {
    a_touch: false,
    a: false,
    b_touch: false,
    b: false,
    stick_touch: false,
    stick: false,
    trigger_touch: false,
    grip_touch: false,
    face_touch: false,
    stick_up_down: 0,
    stick_left_right: 0,
    trigger: 0,
    grip: 0,
    position: [0, 0, 0],
    orientation: [0, 0, 0, 0],
    linearVelocity: [0, 0, 0],
    linearAcceleration: [0, 0, 0],
    angularVelocity: [0, 0, 0],
    angularAcceleration: [0, 0, 0]
  };
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Actions
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createBinding(actionDefinition, bindingDefinition) {
  const actionSetNames = _.uniq(
    _.map(actionDefinition.actions, action => action.name.slice(1, 1 + _.indexOf(action.name.substring(1), "/")))
  );

  return _.object(
    actionSetNames,
    _.map(actionSetNames, setName => {
      const relevantActions = _.filter(
        actionDefinition.actions,
        action => action.name.includes(setName) && action.name.includes("/in/")
      );
      const simpleNames = _.map(relevantActions, action => {
        return action.name.substring("/in/".length + action.name.indexOf("/in/"));
      });

      const types = _.map(relevantActions, action => {
        const matchingBinding = _.filter(bindingDefinition.bindings, binding => {
          return binding.destination === action.name;
        });

        if (matchingBinding.length > 1) {
          console.warn("too many matching bindings. I don't handle this yet");
        }
        if (matchingBinding.length === 0) {
          console.warn("no matching binding for action:", action);
        }

        return { type: action.type, binding: matchingBinding[0] };
      });

      return _.object(simpleNames, types);
    })
  );
}

const pollActionSetFrame = (function() {
  let rightOculusTouchGamepad = null;
  let isEvenFrame = false;
  const rightOculusTouchInputFrame_Even = createRightOculusTouchInputFrame();
  const rightOculusTouchInputFrame_Odd = createRightOculusTouchInputFrame();
  return function pollActionSetFrame(actionSet, actionFrame, binding) {
    isEvenFrame = !isEvenFrame;

    // TODO: Determine whether the binding requires this device.
    const currentRightOculusTouchInputFrame = isEvenFrame
      ? rightOculusTouchInputFrame_Even
      : rightOculusTouchInputFrame_Odd;
    const previousRightOculusTouchInputFrame = isEvenFrame
      ? rightOculusTouchInputFrame_Odd
      : rightOculusTouchInputFrame_Even;
    if (!rightOculusTouchGamepad) {
      rightOculusTouchGamepad = tryGetRightOculusTouchGamepad();
    }
    if (rightOculusTouchGamepad) {
      pollRightOculusTouchInput(rightOculusTouchGamepad, currentRightOculusTouchInputFrame);
    }

    const actions = _.keys(binding[actionSet]);
    for (var i = 0; i < actions.length; i++) {
      const bound = binding[actionSet][actions[i]].binding;
      const sourceInfo = bound.source.split("/");
      if (sourceInfo[1] === "devices") {
        const deviceName = sourceInfo[2];
        const simpleSourceName = sourceInfo[3];
        if (deviceName === "right_oculus_touch") {
          // TODO: replace string comparisons with efficient substitute
          actionFrame[actions[i]] = currentRightOculusTouchInputFrame[simpleSourceName];
        }
      } else {
        // TODO: resolve filters
      }
    }
  };
})();

function idForPath(path, binding) {
  // TODO: Pack input in efficient structures, then use this ID to fetch it out.
  const simpleName = path.substring(path.lastIndexOf("/") + 1);
  return simpleName;
}

function getBool(actionFrame, id) {
  return actionFrame[id];
}

function getQuaternion(actionFrame, id, quaternion) {
  return quaternion.fromArray(actionFrame[id]);
}

function getVector3(actionFrame, id, vector3) {
  return vector3.fromArray(actionFrame[id]);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// App initialization
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const Type_Vector3 = "vector3";
const Type_Quaternion = "quaternion";
const Type_Boolean = "boolean";

const CursorInRightHand = "cursor_in_right_hand";
const CursorInRightHand_In_CursorPosition = `/${CursorInRightHand}/in/cursor_position`;
const CursorInRightHand_In_CursorOrientation = `/${CursorInRightHand}/in/cursor_orientation`;
const CursorInRightHand_In_Interact = `/${CursorInRightHand}/in/interact`;
const CursorInRightHand_In_CameraPosition = `/${CursorInRightHand}/in/camera_position`;
const CursorInRightHand_In_CameraOrientation = `/${CursorInRightHand}/in/camera_orientation`;
const CursorInRightHand_In_CursorPosition_ID = idForPath(CursorInRightHand_In_CursorPosition);
const CursorInRightHand_In_CursorOrientation_ID = idForPath(CursorInRightHand_In_CursorOrientation);
const CursorInRightHand_In_Interact_ID = idForPath(CursorInRightHand_In_Interact);
const CursorInRightHand_In_CameraPosition_ID = idForPath(CursorInRightHand_In_CameraPosition);
const CursorInRightHand_In_CameraOrientation_ID = idForPath(CursorInRightHand_In_CameraOrientation);

const RightHandTeleporting = "right_hand_teleporting";
const RightHandTeleporting_In_TeleportOrigin = `/${RightHandTeleporting}/in/teleport_origin`;
const RightHandTeleporting_In_TeleportOrientation = `/${RightHandTeleporting}/in/teleport_orientation`;
const RightHandTeleporting_In_StillTeleporting = `/${RightHandTeleporting}/in/still_teleporting`;
const RightHandTeleporting_In_TeleportOrigin_ID = idForPath(RightHandTeleporting_In_TeleportOrigin);
const RightHandTeleporting_In_TeleportOrientation_ID = idForPath(RightHandTeleporting_In_TeleportOrientation);
const RightHandTeleporting_In_StillTeleporting_ID = idForPath(RightHandTeleporting_In_StillTeleporting);

const Devices_RightOculusTouch_Position = "/devices/right_oculus_touch/position";
const Devices_RightOculusTouch_Orientation = "/devices/right_oculus_touch/orientation";
const Devices_RightOculusTouch_A = "/devices/right_oculus_touch/a";
const Devices_OculusHMD_Position = "/devices/oculus_hmd/position";
const Devices_OculusHMD_Orientation = "/devices/oculus_hmd/orientation";

const actionDefinition = {
  actions: [
    // Cursor in right hand
    {
      name: CursorInRightHand_In_CursorPosition,
      type: Type_Vector3
    },
    {
      name: CursorInRightHand_In_CursorOrientation,
      type: Type_Quaternion
    },
    {
      name: CursorInRightHand_In_Interact,
      type: Type_Boolean
    },
    {
      name: CursorInRightHand_In_CameraPosition,
      type: Type_Vector3
    },
    {
      name: CursorInRightHand_In_CameraOrientation,
      type: Type_Quaternion
    },

    // During teleport
    {
      name: RightHandTeleporting_In_TeleportOrigin,
      type: Type_Vector3
    },
    {
      name: RightHandTeleporting_In_TeleportOrientation,
      type: Type_Quaternion
    },
    {
      name: RightHandTeleporting_In_StillTeleporting,
      type: Type_Boolean
    }
  ]
};

const bindingDefinition = {
  bindings: [
    {
      source: Devices_RightOculusTouch_Position, // TODO: Move this to a nice place for the pointer to appear
      destination: CursorInRightHand_In_CursorPosition
    },
    {
      source: Devices_RightOculusTouch_Orientation,
      destination: CursorInRightHand_In_CursorOrientation
    },
    {
      source: Devices_RightOculusTouch_A,
      destination: CursorInRightHand_In_Interact
    },
    {
      source: Devices_OculusHMD_Position,
      destination: CursorInRightHand_In_CameraPosition
    },
    {
      source: Devices_OculusHMD_Orientation,
      destination: CursorInRightHand_In_CameraOrientation
    },

    {
      source: Devices_RightOculusTouch_Position,
      destination: RightHandTeleporting_In_TeleportOrigin
    },
    {
      source: Devices_RightOculusTouch_Orientation,
      destination: RightHandTeleporting_In_TeleportOrientation
    },
    {
      source: Devices_RightOculusTouch_A,
      destination: RightHandTeleporting_In_StillTeleporting // TODO: Use filter to flip true -> false
    }
  ]
};

const Vector3_Forward = new THREE.Vector3(0, 0, -1);

const actionFrame = {};
let actionSet = CursorInRightHand;
const binding = createBinding(actionDefinition, bindingDefinition);
let device = null;

const InputSystem = {
  doInit() {
    this.onDisplayConnect = this.onDisplayConnect.bind(this);
    window.addEventListener("vrdisplayconnect", this.onDisplayConnect);
  },
  onDisplayConnect(event) {
    device = event.device;
  },
  doTick() {
    pollActionSetFrame(actionSet, actionFrame, binding);
  }
};
window.actionFrame = actionFrame;
window.device = device;

const PointersSystem = {
  doInit: function() {
    this.raycaster = new THREE.Raycaster();
    this.rightHandPointer = createPointer();
    this.quaternion = new THREE.Quaternion();
    this.intersects = [];
  },
  doTick: function() {
    ///////////////////////////// /////////////////////////////
    // TODO: Get rid of this crap
    if (!this.rightHandBox) {
      this.rightHandBox = document.querySelector("#right-hand-box").object3D;
    }
    if (!this.rightController) {
      this.rightController = document.querySelector("#player-right-controller");
    }
    if (!this.playerRig) {
      this.playerRig = document.querySelector("#player-rig").object3D;
    }
    if (!this.rightHandBox || !this.playerRig) {
      return;
    }
    // TODO: Get rid of this crap
    ///////////////////////////// /////////////////////////////

    if (actionSet === CursorInRightHand) {
      const pointer = this.rightHandPointer;
      getVector3(actionFrame, CursorInRightHand_In_CursorPosition_ID, pointer.origin);
      getQuaternion(actionFrame, CursorInRightHand_In_CursorOrientation_ID, this.quaternion);
      this.playerRig.localToWorld(pointer.origin);
      this.quaternion.premultiply(this.playerRig.quaternion);
      pointer.direction.copy(Vector3_Forward).applyQuaternion(this.quaternion);

      this.raycaster.set(pointer.origin, pointer.direction);
      this.intersects.length = 0;
      this.raycaster.intersectObjects(raycastGroups["ui"], false, this.intersects);
      this.rightHandBox.el.children[0].setAttribute("material", "color", "#ffffff");
      if (this.intersects.length) {
        window.intersect = this.intersects[0];
        this.rightHandBox.el.children[0].setAttribute("material", "color", "#00ff00");
        // TODO: switch to cursor hovering over UI and return;
      }

      this.rightHandBox.visible = true;
      this.rightHandBox.position.copy(pointer.origin);
      this.rightHandBox.quaternion.copy(this.quaternion);

      if (getBool(actionFrame, CursorInRightHand_In_Interact_ID)) {
        this.rightController.emit("cursor-teleport_down");
        this.rightHandBox.visible = false;
        actionSet = RightHandTeleporting;
        return;
      }
    } else if (actionSet === RightHandTeleporting) {
      // The teleportation origin / orientation is still handles by the other input model at the moment.
      // But we will take over the boolean actions

      if (!getBool(actionFrame, RightHandTeleporting_In_StillTeleporting_ID)) {
        this.rightController.emit("cursor-teleport_up");
        actionSet = CursorInRightHand;
        return;
      }
    }
  }
};
window.PointersSystem = PointersSystem;

AFRAME.registerSystem("foo", {
  init: function init() {
    InputSystem.doInit();
    PointersSystem.doInit();
  },

  tick: function tick() {
    InputSystem.doTick();
    PointersSystem.doTick();
  }
});

const raycastGroups = {};
window.raycastGroups = raycastGroups;

AFRAME.registerComponent("raycast-target", {
  multiple: true,
  schema: { type: "string" },
  init() {
    const group = this.data;
    if (!raycastGroups[group]) {
      raycastGroups[group] = [];
    }
    raycastGroups[group].push(this.el.object3DMap.mesh);
  }
});

function createPointer() {
  return {
    origin: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    target: null
  };
}
