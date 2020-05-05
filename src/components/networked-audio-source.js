const INFO_INIT_FAILED = "Failed to initialize networked-audio-source.";
const INFO_NO_NETWORKED_EL = "Could not find networked el.";
const INFO_NO_OWNER = "Networked component has no owner.";

// Chrome seems to require a MediaStream be attached to an AudioElement before AudioNodes work correctly
// We don't want to do this in other browsers, particularly in Safari, which actually plays the audio despite
// setting the volume to 0.
const SHOULD_CREATE_SILENT_AUDIO_ELS = /chrome/i.test(navigator.userAgent);
function createSilentAudioEl(stream) {
  const audioEl = new Audio();
  audioEl.setAttribute("autoplay", "autoplay");
  audioEl.setAttribute("playsinline", "playsinline");
  audioEl.srcObject = stream;
  audioEl.volume = 0; // we don't actually want to hear audio from this element
  return audioEl;
}

function getOrCreateAudioListenerForScene(scene) {
  if (!scene.audioListener) {
    // Would prefer not to have to do this, and am not sure if it's required,
    // so adding a warning for now and hoping to remove this later.
    console.warn("Scene did not have an audio listener. Creating one now.");
    scene.audioListener = new THREE.AudioListener();
    scene.camera && scene.camera.add(scene.audioListener);
    scene.addEventListener("camera-set-active", function(evt) {
      evt.detail.cameraEl.getObject3D("camera").add(scene.audioListener);
    });
  }
  return scene.audioListener;
}

async function getMediaStream(el) {
  const networkedEl = await NAF.utils.getNetworkedEntity(el).catch(e => {
    console.error(INFO_INIT_FAILED, INFO_NO_NETWORKED_EL, e);
  });
  if (!networkedEl) {
    return null;
  }
  const ownerId = networkedEl.components.networked.data.owner;
  if (!ownerId) {
    console.error(INFO_INIT_FAILED, INFO_NO_OWNER);
    return null;
  }
  const stream = await NAF.connection.adapter.getMediaStream(ownerId).catch(e => {
    console.error(INFO_INIT_FAILED, `Error getting media stream for ${ownerId}`, e);
  });
  if (!stream) {
    return null;
  }
  return stream;
}

AFRAME.registerComponent("networked-audio-source", {
  schema: {
    positional: { default: true },
    distanceModel: {
      default: "inverse",
      oneOf: ["linear", "inverse", "exponential"]
    },
    maxDistance: { default: 10000 },
    refDistance: { default: 1 },
    rolloffFactor: { default: 1 }
  },

  init: async function() {
    this.el.sceneEl.systems["hubs-systems"].audioSettingsSystem.registerAvatarAudioSource(this);
    const stream = await getMediaStream(this.el);
    const isRemoved = !this.el.parentNode;
    if (!stream || isRemoved) return;

    const audioListener = getOrCreateAudioListenerForScene(this.el.sceneEl);
    const audio = this.data.positional ? new THREE.PositionalAudio(audioListener) : new THREE.Audio(audioListener);
    if (this.data.positional) {
      audio.setDistanceModel(this.data.distanceModel);
      audio.setMaxDistance(this.data.maxDistance);
      audio.setRefDistance(this.data.refDistance);
      audio.setRolloffFactor(this.data.rolloffFactor);
    }

    if (SHOULD_CREATE_SILENT_AUDIO_ELS) {
      createSilentAudioEl(stream); // TODO: Do the audio els need to get cleaned up?
    }

    const mediaStreamSource = audio.context.createMediaStreamSource(stream);
    audio.setNodeSource(mediaStreamSource);
    this.el.emit("sound-source-set", { soundSource: mediaStreamSource });
    this.el.setObject3D(this.attrName, audio);
  },

  update(oldData) {
    const audio = this.el.getObject3D(this.attrName);
    if (!audio) return;

    const shouldRecreateAudio = oldData.positional !== this.data.positional;
    if (shouldRecreateAudio) {
      audio.disconnect();
      this.el.removeObject3D(this.attrName);
      this.init();
    } else if (this.data.positional) {
      audio.setDistanceModel(this.data.distanceModel);
      audio.setMaxDistance(this.data.maxDistance);
      audio.setRefDistance(this.data.refDistance);
      audio.setRolloffFactor(this.data.rolloffFactor);
    }
  },

  remove: function() {
    const audio = this.el.getObject3D(this.attrName);
    if (!audio) return;

    audio.disconnect();
    this.el.removeObject3D(this.attrName);
    this.el.sceneEl.systems["hubs-systems"].audioSettingsSystem.unregisterAvatarAudioSource(this);
  }
});
