import { injectCustomShaderChunks } from "../utils/media-utils";
import { AVATAR_TYPES } from "../utils/avatar-utils";
import { registerComponentInstance, deregisterComponentInstance } from "../utils/component-utils";
import defaultAvatar from "../assets/models/DefaultAvatar.glb";
import { MediaDevicesEvents } from "../utils/media-devices-utils";

import { Layers } from "./layers";

function ensureAvatarNodes(json) {
  const { nodes } = json;
  if (!nodes.some(node => node.name === "Head")) {
    // If the avatar model doesn't have a Head node. The user has probably chosen a custom GLB.
    // So, we need to construct a suitable hierarchy for avatar functionality to work.
    // We re-parent the original root node to the Head node and set the scene root to a new AvatarRoot.

    // Note: We assume that the first node in the primary scene is the one we care about.
    const originalRoot = json.scenes[json.scene].nodes[0];
    nodes.push({ name: "LeftEye", extensions: { MOZ_hubs_components: {} } });
    nodes.push({ name: "RightEye", extensions: { MOZ_hubs_components: {} } });
    nodes.push({
      name: "Head",
      children: [originalRoot, nodes.length - 1, nodes.length - 2],
      extensions: { MOZ_hubs_components: { "scale-audio-feedback": "" } }
    });
    nodes.push({ name: "Neck", children: [nodes.length - 1] });
    nodes.push({ name: "Spine", children: [nodes.length - 1] });
    nodes.push({ name: "Hips", children: [nodes.length - 1] });
    nodes.push({ name: "AvatarRoot", children: [nodes.length - 1] });
    json.scenes[json.scene].nodes[0] = nodes.length - 1;
  }
  return json;
}

// This code is from three-vrm. We will likely be using that in the future and this inlined code can go away
function excludeTriangles(triangles, bws, skinIndex, exclude) {
  let count = 0;
  if (bws != null && bws.length > 0) {
    for (let i = 0; i < triangles.length; i += 3) {
      const a = triangles[i];
      const b = triangles[i + 1];
      const c = triangles[i + 2];
      const bw0 = bws[a];
      const skin0 = skinIndex[a];

      if (bw0[0] > 0 && exclude.includes(skin0[0])) continue;
      if (bw0[1] > 0 && exclude.includes(skin0[1])) continue;
      if (bw0[2] > 0 && exclude.includes(skin0[2])) continue;
      if (bw0[3] > 0 && exclude.includes(skin0[3])) continue;

      const bw1 = bws[b];
      const skin1 = skinIndex[b];
      if (bw1[0] > 0 && exclude.includes(skin1[0])) continue;
      if (bw1[1] > 0 && exclude.includes(skin1[1])) continue;
      if (bw1[2] > 0 && exclude.includes(skin1[2])) continue;
      if (bw1[3] > 0 && exclude.includes(skin1[3])) continue;

      const bw2 = bws[c];
      const skin2 = skinIndex[c];
      if (bw2[0] > 0 && exclude.includes(skin2[0])) continue;
      if (bw2[1] > 0 && exclude.includes(skin2[1])) continue;
      if (bw2[2] > 0 && exclude.includes(skin2[2])) continue;
      if (bw2[3] > 0 && exclude.includes(skin2[3])) continue;

      triangles[count++] = a;
      triangles[count++] = b;
      triangles[count++] = c;
    }
  }
  return count;
}

function createErasedMesh(src, erasingBonesIndex) {
  const dst = new THREE.SkinnedMesh(src.geometry.clone(), src.material);
  dst.name = `${src.name}(headless)`;
  dst.frustumCulled = src.frustumCulled;
  dst.layers.set(Layers.CAMERA_LAYER_FIRST_PERSON_ONLY);

  const geometry = dst.geometry;

  const skinIndexAttr = geometry.getAttribute("skinIndex").array;
  const skinIndex = [];
  for (let i = 0; i < skinIndexAttr.length; i += 4) {
    skinIndex.push([skinIndexAttr[i], skinIndexAttr[i + 1], skinIndexAttr[i + 2], skinIndexAttr[i + 3]]);
  }

  const skinWeightAttr = geometry.getAttribute("skinWeight").array;
  const skinWeight = [];
  for (let i = 0; i < skinWeightAttr.length; i += 4) {
    skinWeight.push([skinWeightAttr[i], skinWeightAttr[i + 1], skinWeightAttr[i + 2], skinWeightAttr[i + 3]]);
  }

  const index = geometry.getIndex();
  if (!index) {
    throw new Error("The geometry doesn't have an index buffer");
  }
  const oldTriangles = Array.from(index.array);

  const count = excludeTriangles(oldTriangles, skinWeight, skinIndex, erasingBonesIndex);
  const newTriangle = [];
  for (let i = 0; i < count; i++) {
    newTriangle[i] = oldTriangles[i];
  }
  geometry.setIndex(newTriangle);

  if (src.onBeforeRender) {
    dst.onBeforeRender = src.onBeforeRender;
  }

  dst.bind(new THREE.Skeleton(src.skeleton.bones, src.skeleton.boneInverses), new THREE.Matrix4());

  return dst;
}

function isEraseTarget(bone) {
  return bone.name === "Head" || (bone.parent && isEraseTarget(bone.parent));
}

function createHeadlessModelForSkinnedMesh(parent, mesh) {
  const eraseBoneIndexes = [];
  mesh.skeleton.bones.forEach((bone, index) => {
    if (isEraseTarget(bone)) eraseBoneIndexes.push(index);
  });

  if (!eraseBoneIndexes.length) {
    mesh.layers.enable(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);
    mesh.layers.enable(Layers.CAMERA_LAYER_FIRST_PERSON_ONLY);
    return;
  }

  mesh.layers.set(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);

  const newMesh = createErasedMesh(mesh, eraseBoneIndexes);
  parent.add(newMesh);
}

/**
 * Sets player info state, including avatar choice and display name.
 * @namespace avatar
 * @component player-info
 */
AFRAME.registerComponent("player-info", {
  schema: {
    avatarSrc: { type: "string" },
    avatarType: { type: "string", default: AVATAR_TYPES.SKINNABLE },
    muted: { default: false },
    isSharingAvatarCamera: { default: false }
  },
  init() {
    this.displayName = null;
    this.identityName = null;
    this.isOwner = false;
    this.isRecording = false;
    this.applyProperties = this.applyProperties.bind(this);
    this.updateDisplayName = this.updateDisplayName.bind(this);
    this.applyDisplayName = this.applyDisplayName.bind(this);
    this.handleModelError = this.handleModelError.bind(this);
    this.handleRemoteModelError = this.handleRemoteModelError.bind(this);
    this.update = this.update.bind(this);
    this.onMicStateChanged = this.onMicStateChanged.bind(this);
    this.onAvatarModelLoaded = this.onAvatarModelLoaded.bind(this);

    this.isLocalPlayerInfo = this.el.id === "avatar-rig";
    this.playerSessionId = null;

    if (!this.isLocalPlayerInfo) {
      NAF.utils.getNetworkedEntity(this.el).then(networkedEntity => {
        this.playerSessionId = NAF.utils.getCreator(networkedEntity);
        const playerPresence = window.APP.hubChannel.presence.state[this.playerSessionId];
        if (playerPresence) {
          this.updateFromPresenceMeta(playerPresence.metas[0]);
        }
      });
    }
    registerComponentInstance(this, "player-info");
  },
  remove() {
    const avatarEl = this.el.querySelector("[avatar-audio-source]");
    APP.isAudioPaused.delete(avatarEl);
    deregisterComponentInstance(this, "player-info");
  },

  onAvatarModelLoaded(e) {
    this.applyProperties(e);

    const modelEl = this.el.querySelector(".model");
    if (this.isLocalPlayerInfo && e.target === modelEl) {
      console.log("OWN AVATAR LOADED", modelEl);
      modelEl.object3D.traverse(function(o) {
        if (o.isSkinnedMesh) {
          console.log(o);
          createHeadlessModelForSkinnedMesh(o.parent, o);
        }
      });
    }
  },

  play() {
    this.el.addEventListener("model-loaded", this.onAvatarModelLoaded);
    this.el.sceneEl.addEventListener("presence_updated", this.updateDisplayName);
    if (this.isLocalPlayerInfo) {
      this.el.querySelector(".model").addEventListener("model-error", this.handleModelError);
    } else {
      this.el.querySelector(".model").addEventListener("model-error", this.handleRemoteModelError);
    }
    window.APP.store.addEventListener("statechanged", this.update);

    this.el.sceneEl.addEventListener("stateadded", this.update);
    this.el.sceneEl.addEventListener("stateremoved", this.update);

    if (this.isLocalPlayerInfo) {
      APP.dialog.on("mic-state-changed", this.onMicStateChanged);
    }
  },
  pause() {
    this.el.removeEventListener("model-loaded", this.onAvatarModelLoaded);
    this.el.sceneEl.removeEventListener("presence_updated", this.updateDisplayName);
    if (this.isLocalPlayerInfo) {
      this.el.querySelector(".model").removeEventListener("model-error", this.handleModelError);
    } else {
      this.el.querySelector(".model").removeEventListener("model-error", this.handleRemoteModelError);
    }
    this.el.sceneEl.removeEventListener("stateadded", this.update);
    this.el.sceneEl.removeEventListener("stateremoved", this.update);
    window.APP.store.removeEventListener("statechanged", this.update);

    if (this.isLocalPlayerInfo) {
      APP.dialog.off("mic-state-changed", this.onMicStateChanged);
    }
  },

  update(oldData) {
    if (this.data.muted !== oldData.muted) {
      this.el.emit("remote_mute_updated", { muted: this.data.muted });
    }
    this.applyProperties();
  },
  updateDisplayName(e) {
    if (!this.playerSessionId && this.isLocalPlayerInfo) {
      this.playerSessionId = NAF.clientId;
    }
    if (!this.playerSessionId) return;
    if (this.playerSessionId !== e.detail.sessionId) return;

    this.updateFromPresenceMeta(e.detail);
  },
  updateFromPresenceMeta(presenceMeta) {
    this.permissions = presenceMeta.permissions;
    this.displayName = presenceMeta.profile.displayName;
    this.identityName = presenceMeta.profile.identityName;
    this.isRecording = !!(presenceMeta.streaming || presenceMeta.recording);
    this.isOwner = !!(presenceMeta.roles && presenceMeta.roles.owner);
    this.applyDisplayName();
  },
  can(perm) {
    return !!this.permissions && this.permissions[perm];
  },
  applyDisplayName() {
    const store = window.APP.store;

    const infoShouldBeHidden =
      this.isLocalPlayerInfo || (store.state.preferences.onlyShowNametagsInFreeze && !this.el.sceneEl.is("frozen"));

    const nametagEl = this.el.querySelector(".nametag");
    if (this.displayName && nametagEl) {
      nametagEl.setAttribute("text", { value: this.displayName });
      nametagEl.object3D.visible = !infoShouldBeHidden;
    }
    const identityNameEl = this.el.querySelector(".identityName");
    if (identityNameEl) {
      if (this.identityName) {
        identityNameEl.setAttribute("text", { value: this.identityName });
        identityNameEl.object3D.visible = this.el.sceneEl.is("frozen");
      }
    }
    const recordingBadgeEl = this.el.querySelector(".recordingBadge");
    if (recordingBadgeEl) {
      recordingBadgeEl.object3D.visible = this.isRecording && !infoShouldBeHidden;
    }

    const modBadgeEl = this.el.querySelector(".modBadge");
    if (modBadgeEl) {
      modBadgeEl.object3D.visible = !this.isRecording && this.isOwner && !infoShouldBeHidden;
    }
  },
  applyProperties(e) {
    this.applyDisplayName();

    const modelEl = this.el.querySelector(".model");
    if (this.data.avatarSrc && modelEl) {
      modelEl.components["gltf-model-plus"].jsonPreprocessor = ensureAvatarNodes;
      modelEl.setAttribute("gltf-model-plus", "src", this.data.avatarSrc);
    }

    if (!e || e.target === modelEl) {
      const uniforms = injectCustomShaderChunks(this.el.object3D);
      this.el.querySelectorAll("[hover-visuals]").forEach(el => {
        el.components["hover-visuals"].uniforms = uniforms;
      });
    }

    const videoTextureTargets = modelEl.querySelectorAll("[video-texture-target]");

    const sessionId = this.isLocalPlayerInfo ? NAF.clientId : this.playerSessionId;

    for (const el of Array.from(videoTextureTargets)) {
      el.setAttribute("video-texture-target", {
        src: this.data.isSharingAvatarCamera ? `hubs://clients/${sessionId}/video` : ""
      });

      if (this.isLocalPlayerInfo) {
        el.setAttribute("emit-scene-event-on-remove", `event:${MediaDevicesEvents.VIDEO_SHARE_ENDED}`);
      }
    }

    const avatarEl = this.el.querySelector("[avatar-audio-source]");
    if (this.data.muted) {
      APP.isAudioPaused.add(avatarEl);
    } else {
      APP.isAudioPaused.delete(avatarEl);
    }
  },
  handleModelError() {
    window.APP.store.resetToRandomDefaultAvatar();
  },
  handleRemoteModelError() {
    this.data.avatarSrc = defaultAvatar;
    this.applyProperties();
  },
  onMicStateChanged({ enabled }) {
    this.el.setAttribute("player-info", { muted: !enabled });
  }
});
