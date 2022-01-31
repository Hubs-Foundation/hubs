import { EventEmitter } from "eventemitter3";
import {
  MediaDevicesEvents,
  PermissionStatus,
  MediaDevices,
  DEFAULT_DEVICE_ID,
  NO_DEVICE_ID
} from "./media-devices-utils";
import { detectOS, detect } from "detect-browser";

const isMobile = AFRAME.utils.device.isMobile();
const isMobileVR = AFRAME.utils.device.isMobileVR();
const isFirefoxReality = isMobileVR && navigator.userAgent.match(/Firefox/);

// This is a list of regexes that match the microphone labels of HMDs.
//
// If entering VR mode, and if any of these regexes match an audio device,
// the user will be prevented from entering VR until one of those devices is
// selected as the microphone.
//
// Note that this doesn't have to be exhaustive: if no devices match any regex
// then we rely upon the user to select the proper mic.
const HMD_MIC_REGEXES = [/\Wvive\W/i, /\Wrift\W/i];

const audioOutputSelectEnabled = "sinkId" in HTMLMediaElement.prototype;

// Subsequest calls to getUserMedia throw an exception and return a muted track so we disable mic selection for the moment.
// Safari 15+
const detectedOS = detectOS(navigator.userAgent);
const browser = detect();
const audioInputSelectEnabled = !(["iOS", "Mac OS"].includes(detectedOS) && ["safari", "ios"].includes(browser.name));

export default class MediaDevicesManager extends EventEmitter {
  constructor(scene, store, audioSystem) {
    super();

    this._scene = scene;
    this._store = store;
    this._micDevices = [];
    this._videoDevices = [];
    this._outputDevices = [];
    this._deviceId = null;
    this._audioTrack = null;
    this.audioSystem = audioSystem;
    this._mediaStream = audioSystem.outboundStream;
    this._permissionsStatus = {
      [MediaDevices.MICROPHONE]: PermissionStatus.PROMPT,
      [MediaDevices.SPEAKERS]: PermissionStatus.PROMPT,
      [MediaDevices.CAMERA]: PermissionStatus.PROMPT,
      [MediaDevices.SCREEN]: PermissionStatus.PROMPT
    };

    this.onDeviceChange = this.onDeviceChange.bind(this);
    navigator.mediaDevices.addEventListener("devicechange", this.onDeviceChange);
  }

  static get isAudioOutputSelectEnabled() {
    return audioOutputSelectEnabled;
  }

  static get isAudioInputSelectEnabled() {
    return audioInputSelectEnabled;
  }

  get deviceId() {
    return this._deviceId;
  }

  set deviceId(deviceId) {
    this._deviceId = deviceId;
  }

  get audioTrack() {
    return this._audioTrack;
  }

  set audioTrack(audioTrack) {
    this._audioTrack = audioTrack;
  }

  get micDevices() {
    if (MediaDevicesManager.isAudioInputSelectEnabled) {
      if (this._permissionsStatus[MediaDevices.MICROPHONE] === PermissionStatus.DENIED) {
        return [{ value: NO_DEVICE_ID, label: "None" }];
      } else {
        return this._micDevices;
      }
    } else {
      return [{ value: DEFAULT_DEVICE_ID, label: "Default" }];
    }
  }

  set micDevices(micDevices) {
    this._micDevices = micDevices;
  }

  get videoDevices() {
    return this._videoDevices;
  }

  set videoDevices(videoDevices) {
    this._videoDevices = videoDevices;
  }

  set outputDevices(outputDevices) {
    this._outputDevices = outputDevices;
  }

  get outputDevices() {
    return this._outputDevices;
  }

  get mediaStream() {
    return this._mediaStream;
  }

  set mediaStream(mediaStream) {
    this._mediaStream = mediaStream;
  }

  get selectedMicLabel() {
    return this.micLabelForAudioTrack(this.audioTrack);
  }

  get selectedMicDeviceId() {
    if (MediaDevicesManager.isAudioInputSelectEnabled) {
      if (this._permissionsStatus[MediaDevices.MICROPHONE] === PermissionStatus.DENIED) {
        return NO_DEVICE_ID;
      } else {
        return this.deviceIdForMicDeviceLabel(this.selectedMicLabel) || DEFAULT_DEVICE_ID;
      }
    } else {
      return DEFAULT_DEVICE_ID;
    }
  }

  get preferredMicDeviceId() {
    if (MediaDevicesManager.isAudioInputSelectEnabled) {
      if (this._permissionsStatus[MediaDevices.MICROPHONE] === PermissionStatus.DENIED) {
        return NO_DEVICE_ID;
      } else {
        const { preferredMic } = this._store.state.preferences;
        return preferredMic || DEFAULT_DEVICE_ID;
      }
    } else {
      return DEFAULT_DEVICE_ID;
    }
  }

  get selectedSpeakersDeviceId() {
    const { preferredSpeakers } = this._store.state.preferences;
    const exists = this.outputDevices.some(device => {
      return device.value === preferredSpeakers;
    });
    return exists ? preferredSpeakers : this.outputDevices[0]?.value || DEFAULT_DEVICE_ID;
  }

  get isMicShared() {
    return this.audioTrack !== null && this.getPermissionsStatus(MediaDevices.MICROPHONE) === PermissionStatus.GRANTED;
  }

  get isVideoShared() {
    return this._mediaStream?.getVideoTracks().length > 0;
  }

  get isWebcamShared() {
    return this._mediaStream.getVideoTracks().some(track => {
      track["_hubs_contentHint"] === MediaDevices.CAMERA;
    });
  }

  get isScreenShared() {
    return this._mediaStream.getVideoTracks().some(track => {
      track["_hubs_contentHint"] === MediaDevices.SCREEN;
    });
  }

  set micEnabled(enabled) {
    APP.dialog.enableMicrophone(enabled);
  }

  get isMicEnabled() {
    return APP.dialog.isMicEnabled;
  }

  set micShouldBeEnabled(enabled) {
    APP.dialog.micShouldBeEnabled = enabled;
  }

  toggleMic() {
    APP.dialog.toggleMicrophone();
  }

  getPermissionsStatus(type) {
    return this._permissionsStatus[type];
  }

  onDeviceChange = () => {
    this.fetchMediaDevices().then(() => {
      this.emit(MediaDevicesEvents.DEVICE_CHANGE, null);
    });
  };

  async updatePermissions() {
    await this.fetchMediaDevices();
    const micStatus = this.micDevices.length === 0 ? PermissionStatus.PROMPT : PermissionStatus.GRANTED;
    this._permissionsStatus[MediaDevices.MICROPHONE] = micStatus;
    this.emit(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, {
      mediaDevice: MediaDevices.MICROPHONE,
      status: micStatus
    });
    const videoStatus = this.videoDevices.length === 0 ? PermissionStatus.PROMPT : PermissionStatus.GRANTED;
    this._permissionsStatus[MediaDevices.CAMERA] = videoStatus;
    this.emit(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, {
      mediaDevice: MediaDevices.CAMERA,
      status: videoStatus
    });
    const speakersStatus = this.micDevices.length === 0 ? PermissionStatus.PROMPT : PermissionStatus.GRANTED;
    this._permissionsStatus[MediaDevices.SPEAKERS] = speakersStatus;
    this.emit(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, {
      mediaDevice: MediaDevices.SPEAKERS,
      status: speakersStatus
    });
  }

  async fetchMediaDevices() {
    console.log("Fetching media devices");
    return new Promise(resolve => {
      navigator.mediaDevices.enumerateDevices().then(mediaDevices => {
        mediaDevices = mediaDevices.filter(d => d.label !== "");
        if (MediaDevicesManager.isAudioInputSelectEnabled) {
          this.micDevices = mediaDevices
            .filter(d => d.kind === "audioinput")
            .map(d => ({ value: d.deviceId, label: d.label || `Mic Device (${d.deviceId.substr(0, 9)})` }));
        }
        this.videoDevices = mediaDevices
          .filter(d => d.kind === "videoinput")
          .map(d => ({ value: d.deviceId, label: d.label || `Camera Device (${d.deviceId.substr(0, 9)})` }));
        if (MediaDevicesManager.isAudioOutputSelectEnabled) {
          this.outputDevices = mediaDevices
            .filter(d => d.kind === "audiooutput")
            .map(d => ({ value: d.deviceId, label: d.label || `Audio Output (${d.deviceId.substr(0, 9)})` }));
        }
        resolve();
      });
    });
  }

  changeAudioOutput(deviceId) {
    this._store.update({ preferences: { preferredSpeakers: deviceId } });
  }

  async startMicShare({ deviceId, unmute, updatePrefs = true }) {
    if (this.isMicShared && this.selectedMicDeviceId === deviceId) return;
    console.log("Starting microphone sharing");

    if (!deviceId) {
      deviceId = DEFAULT_DEVICE_ID;
    }
    let constraints = { audio: {} };
    if (deviceId) {
      constraints = { audio: { deviceId: { ideal: [deviceId] } } };
    }

    const result = await this._startMicShare(constraints);

    await this.fetchMediaDevices();

    // we should definitely have an audioTrack at this point unless they denied mic access
    if (this.audioTrack) {
      const micDeviceId = this.deviceIdForMicDeviceLabel(this.micLabelForAudioTrack(this.audioTrack));
      if (micDeviceId) {
        updatePrefs && this._store.update({ preferences: { preferredMic: micDeviceId } });
        console.log(`Selected input device: ${this.micLabelForDeviceId(micDeviceId)}`);
      }
    } else {
      console.log("No available audio tracks");
    }

    await APP.dialog.setLocalMediaStream(this._mediaStream);

    if (unmute) {
      APP.dialog.enableMicrophone(true);
    }

    if (result) {
      this._scene.emit(MediaDevicesEvents.MIC_SHARE_STARTED);
      this._permissionsStatus[MediaDevices.MICROPHONE] = PermissionStatus.GRANTED;
      this.emit(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, {
        mediaDevice: MediaDevices.MICROPHONE,
        status: PermissionStatus.GRANTED
      });
    } else {
      this._scene.emit(MediaDevicesEvents.MIC_SHARE_ENDED);
      this._permissionsStatus[MediaDevices.MICROPHONE] = PermissionStatus.DENIED;
      this.emit(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, {
        mediaDevice: MediaDevices.MICROPHONE,
        status: PermissionStatus.DENIED
      });
    }

    return result;
  }

  async _startMicShare(constraints = { audio: {} }) {
    if (this.audioTrack) {
      this.audioTrack.stop();
    }

    constraints.audio.echoCancellation = this._store.state.preferences.disableEchoCancellation === true ? false : true;
    constraints.audio.noiseSuppression = this._store.state.preferences.disableNoiseSuppression === true ? false : true;
    constraints.audio.autoGainControl = this._store.state.preferences.disableAutoGainControl === true ? false : true;

    if (isFirefoxReality) {
      //workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1626081
      constraints.audio.echoCancellation =
        this._store.state.preferences.disableEchoCancellation === false ? true : false;
      constraints.audio.noiseSuppression =
        this._store.state.preferences.disableNoiseSuppression === false ? true : false;
      constraints.audio.autoGainControl = this._store.state.preferences.disableAutoGainControl === false ? true : false;

      this._store.update({
        preferences: {
          disableEchoCancellation: !constraints.audio.echoCancellation,
          disableNoiseSuppression: !constraints.audio.noiseSuppression,
          disableAutoGainControl: !constraints.audio.autoGainControl
        }
      });
    }

    try {
      console.log("Adding microphone media stream");
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.audioSystem.addStreamToOutboundAudio("microphone", newStream);
      this.audioTrack = newStream.getAudioTracks()[0];
      this.audioTrack.addEventListener("ended", async () => {
        this._permissionsStatus[MediaDevices.MICROPHONE] = PermissionStatus.DENIED;
        await this.fetchMediaDevices();
        this._scene.emit(MediaDevicesEvents.MIC_SHARE_ENDED);
        this.emit(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, {
          mediaDevice: MediaDevices.MICROPHONE,
          status: PermissionStatus.DENIED
        });
      });

      if (/Oculus/.test(navigator.userAgent)) {
        // HACK Oculus Browser 6 seems to randomly end the microphone audio stream. This re-creates it.
        // Note the ended event will only fire if some external event ends the stream, not if we call stop().
        const recreateAudioStream = async () => {
          console.warn(
            "Oculus Browser 6 bug hit: Audio stream track ended without calling stop. Recreating audio stream."
          );

          const newStream = await navigator.mediaDevices.getUserMedia(constraints);
          this.audioTrack = newStream.getAudioTracks()[0];

          this.audioSystem.addStreamToOutboundAudio("microphone", newStream);

          this._scene.emit(MediaDevicesEvents.MIC_SHARE_STARTED);

          this.audioTrack.addEventListener("ended", recreateAudioStream, { once: true });
        };

        this.audioTrack.addEventListener("ended", recreateAudioStream, { once: true });
      }

      return true;
    } catch (e) {
      // Error fetching audio track, most likely a permission denial.
      console.error("Error during getUserMedia: ", e);
      this.audioTrack = null;
      return false;
    }
  }

  async stopMicShare() {
    this.audioSystem.removeStreamFromOutboundAudio("microphone");

    this.audioTrack?.stop();
    this.audioTrack = null;

    await APP.dialog.setLocalMediaStream(this._mediaStream);
    APP.dialog.enableMicrophone(false);
  }

  async startVideoShare(constraints, isDisplayMedia, target, success, error) {
    let newStream;
    let videoTrackAdded = false;

    try {
      if (isDisplayMedia) {
        newStream = await navigator.mediaDevices.getDisplayMedia(constraints);
      } else {
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      const videoTracks = newStream ? newStream.getVideoTracks() : [];
      if (videoTracks.length > 0) {
        videoTrackAdded = true;

        newStream.getVideoTracks().forEach(track => {
          // Ideally we would use track.contentHint but it seems to be read-only in Chrome so we just add a custom property
          track["_hubs_contentHint"] = isDisplayMedia ? MediaDevices.SCREEN : MediaDevices.CAMERA;
          track.addEventListener("ended", async () => {
            await this.fetchMediaDevices();
            const mediaDevice = isDisplayMedia ? MediaDevices.SCREEN : MediaDevices.CAMERA;
            this._permissionsStatus[mediaDevice] = PermissionStatus.DENIED;
            this._scene.emit(MediaDevicesEvents.VIDEO_SHARE_ENDED);
            this.emit(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, {
              mediaDevice,
              status: PermissionStatus.DENIED
            });
          });
          this._mediaStream.addTrack(track);
        });

        if (newStream && newStream.getAudioTracks().length > 0) {
          this.audioSystem.addStreamToOutboundAudio("screenshare", newStream);
        }

        await APP.dialog.setLocalMediaStream(this._mediaStream);

        const mediaDevice = isDisplayMedia ? MediaDevices.SCREEN : MediaDevices.CAMERA;
        this._permissionsStatus[mediaDevice] = PermissionStatus.GRANTED;
        this.emit(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, { mediaDevice, status: PermissionStatus.GRANTED });
      }
    } catch (e) {
      error(e);
      this._scene.emit(MediaDevicesEvents.VIDEO_SHARE_ENDED);
      const mediaDevice = isDisplayMedia ? MediaDevices.SCREEN : MediaDevices.CAMERA;
      this._permissionsStatus[mediaDevice] = PermissionStatus.DENIED;
      this.emit(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, { mediaDevice, status: PermissionStatus.DENIED });
      return;
    }

    this._scene.emit(MediaDevicesEvents.VIDEO_SHARE_STARTED);
    success(isDisplayMedia, videoTrackAdded, target);
  }

  async stopVideoShare() {
    if (!this._mediaStream) return;

    for (const track of this._mediaStream.getVideoTracks()) {
      track.stop(); // Stop video track to remove the "Stop screen sharing" bar right away.
      this._mediaStream.removeTrack(track);
    }

    this.audioSystem.removeStreamFromOutboundAudio("screenshare");

    await APP.dialog.setLocalMediaStream(this._mediaStream);
  }

  async shouldShowHmdMicWarning() {
    if (isMobile || AFRAME.utils.device.isMobileVR()) return false;
    if (!this.state.enterInVR) return false;
    if (!this.hasHmdMicrophone()) return false;

    return !HMD_MIC_REGEXES.find(r => this.selectedMicLabel.match(r));
  }

  micLabelForAudioTrack(audioTrack) {
    return (audioTrack && audioTrack.label) || "";
  }

  deviceIdForMicDeviceLabel(label) {
    return this.micDevices.filter(d => d.label === label).map(d => d.value)[0];
  }

  deviceIdForSpeakersDeviceLabel(label) {
    return this.outputDevices.filter(d => d.label === label).map(d => d.value)[0];
  }

  micLabelForDeviceId(deviceId) {
    return this.micDevices.filter(d => d.value === deviceId).map(d => d.label)[0];
  }

  speakersLabelForDeviceId(deviceId) {
    return this.outputDevices.filter(d => d.value === deviceId).map(d => d.label)[0];
  }

  hasHmdMicrophone() {
    return !!this.state.micDevices.find(d => HMD_MIC_REGEXES.find(r => d.label.match(r)));
  }

  videoDeviceIdForMicLabel(label) {
    return this.videoDevices.filter(d => d.label === label).map(d => d.value)[0];
  }

  videoLabelForDeviceId(deviceId) {
    return this.videoDevices.filter(d => d.value === deviceId).map(d => d.label)[0];
  }
}
