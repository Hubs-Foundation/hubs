const NETWORKED_LOBBY_CAMERA_STATE = "networked-lobby-camera-state";

const setMatrixWorld = (function() {
  const inv = new THREE.Matrix4();
  return function setMatrixWorld(object3D, m) {
    object3D.matrixWorld.copy(m);
    object3D.matrix = inv.getInverse(object3D.parent.matrixWorld).multiply(object3D.matrixWorld);
    object3D.matrix.decompose(object3D.position, object3D.quaternion, object3D.scale);
  };
})();

AFRAME.registerComponent("lobby-camera-transform-component", {
  init() {
    this.el.id = NETWORKED_LOBBY_CAMERA_STATE;
  },
  tick() {
    if (NAF.utils.isMine(this.el)) {
      this.playerCamera = this.playerCamera || document.querySelector("#player-camera").object3D;
      setMatrixWorld(this.el.object3D, this.playerCamera.matrixWorld);
    }
  }
});

export function takeOrCreateLobbyCamera() {
  const state = document.getElementById(NETWORKED_LOBBY_CAMERA_STATE);
  if (!state) {
    const e = document.createElement("a-entity");
    e.setAttribute("networked", "template: #lobby-camera");
    e.id = NETWORKED_LOBBY_CAMERA_STATE;
    AFRAME.scenes[0].appendChild(e);
  } else {
    NAF.utils.takeOwnership(state);
  }
}

export function lobbyCameraIsMine() {
  const state = document.getElementById(NETWORKED_LOBBY_CAMERA_STATE);
  return state && NAF.utils.isMine(state);
}

export function releaseLobbyCamera() {
  const state = document.getElementById(NETWORKED_LOBBY_CAMERA_STATE);
  state.parentNode.removeChild(state);
}

function avatarForSessionId(sessionId) {
  const avatars = document.querySelectorAll("[networked-avatar]");
  for (let i = 0; i < avatars.length; i++) {
    const avatar = avatars[i];
    if (avatar.components.networked.data.owner === sessionId) {
      return avatar;
    }
  }
  return null; // Have not spawned an avatar yet, or invalid session id.
}

export class LobbyCameraSystem {
  tick() {
    const state = document.getElementById(NETWORKED_LOBBY_CAMERA_STATE);
    if (AFRAME.scenes[0].is("entered") || !state || !state.parentNode || NAF.utils.isMine(state)) {
      return;
    }

    this.playerCamera = this.playerCamera || document.querySelector("#player-camera").object3D;
    const avatar = avatarForSessionId(state.components.networked.data.owner);
    const target = avatar ? avatar.querySelector(".camera") : state;
    target.object3D.matrixNeedsUpdate = true;
    target.object3D.updateMatrices();

    //if (avatar) {
    // TODO: Show spectating message.
    // const spectatingMessage = `You are spectating ${avatar.components["player-info"].displayName}.`;
    //}

    setMatrixWorld(this.playerCamera, target.object3D.matrixWorld);
    this.playerCamera.translateZ(-0.1);
    this.playerCamera.matrixNeedsUpdate = true;
  }
}
