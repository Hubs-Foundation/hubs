import { EventEmitter } from "eventemitter3";
import { MediaDevicesEvents, PermissionStatus, MediaDevices, NO_DEVICE_ID } from "./media-devices-utils";
import { detectOS, detect } from "detect-browser";
import { isIOS as detectIOS } from "./is-mobile";

const isMobile = AFRAME.utils.device.isMobile();
const isIOS = detectIOS();

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
    this.onPermissionsUpdated = this.onPermissionsUpdated.bind(this);
    APP.hubChannel.addEventListener("permissions_updated", this.onPermissionsUpdated);
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

  get defaultInputDeviceId() {
    return this._micDevices.length > 0 ? this._micDevices[0].value : NO_DEVICE_ID;
  }

  get defaultOutputDeviceId() {
    return this._outputDevices.length > 0 ? this._outputDevices[0].value : NO_DEVICE_ID;
  }

  get defaultVideoDeviceId() {
    return this._videoDevices.length > 0 ? this._videoDevices[0].value : NO_DEVICE_ID;
  }

  get micDevicesOptions() {
    return this._micDevices.length > 0 ? this._micDevices : [{ value: NO_DEVICE_ID, label: "None" }];
  }

  get videoDevicesOptions() {
    return this._videoDevices.length > 0 ? this._videoDevices : [{ value: NO_DEVICE_ID, label: "None" }];
  }

  get outputDevicesOptions() {
    return this._outputDevices.length > 0 ? this._outputDevices : [{ value: NO_DEVICE_ID, label: "None" }];
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
    return MediaDevicesManager.isAudioInputSelectEnabled &&
      this._permissionsStatus[MediaDevices.MICROPHONE] !== PermissionStatus.GRANTED
      ? NO_DEVICE_ID
      : this.deviceIdForMicDeviceLabel(this.selectedMicLabel);
  }

  get selectedSpeakersDeviceId() {
    const { preferredSpeakers } = this._store.state.preferences;
    const exists = this._outputDevices.some(device => {
      return device.value === preferredSpeakers;
    });
    return exists ? preferredSpeakers : this.defaultOutputDeviceId;
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

  toggleMic() {
    APP.dialog.toggleMicrophone();
  }

  getPermissionsStatus(type) {
    return this._permissionsStatus[type];
  }

  onPermissionsUpdated = () => {
    if (!APP.hubChannel.can("voice_chat")) {
      APP.dialog.enableMicrophone(false);
    }
  };

  onDeviceChange = () => {
    this.fetchMediaDevices().then(() => {
      this.changeAudioOutput(this.selectedSpeakersDeviceId);
      this.emit(MediaDevicesEvents.DEVICE_CHANGE, null);
    });
  };

  updatePermissions() {
    const micStatus = this._micDevices.length === 0 ? PermissionStatus.PROMPT : PermissionStatus.GRANTED;
    this._permissionsStatus[MediaDevices.MICROPHONE] = micStatus;
    this.emit(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, {
      mediaDevice: MediaDevices.MICROPHONE,
      status: micStatus
    });
    const videoStatus = this._videoDevices.length === 0 ? PermissionStatus.PROMPT : PermissionStatus.GRANTED;
    this._permissionsStatus[MediaDevices.CAMERA] = videoStatus;
    this.emit(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, {
      mediaDevice: MediaDevices.CAMERA,
      status: videoStatus
    });
    const speakersStatus = this._micDevices.length === 0 ? PermissionStatus.PROMPT : PermissionStatus.GRANTED;
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
        this._micDevices = mediaDevices
          .filter(d => d.deviceId !== "default" && d.kind === "audioinput")
          .map(d => ({ value: d.deviceId, label: d.label || `Mic Device (${d.deviceId.substring(0, 9)})` }));
        this._videoDevices = mediaDevices
          .filter(d => d.deviceId !== "default" && d.kind === "videoinput")
          .map(d => ({ value: d.deviceId, label: d.label || `Camera Device (${d.deviceId.substring(0, 9)})` }));
        if (MediaDevicesManager.isAudioOutputSelectEnabled) {
          this._outputDevices = mediaDevices
            .filter(d => d.deviceId !== "default" && d.kind === "audiooutput")
            .map(d => ({ value: d.deviceId, label: d.label || `Audio Output (${d.deviceId.substring(0, 9)})` }));
        }
        this.updatePermissions();
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
      const { preferredMic } = this._store.state.preferences;
      deviceId = preferredMic !== NO_DEVICE_ID ? preferredMic : undefined;
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
        if (updatePrefs) {
          this._store.update({
            preferences: {
              preferredMic: micDeviceId,
              preferredSpeakers: this.selectedSpeakersDeviceId
            }
          });
        }
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
      this._permissionsStatus[MediaDevices.MICROPHONE] = PermissionStatus.GRANTED;
      this._scene.emit(MediaDevicesEvents.MIC_SHARE_STARTED);
      this.emit(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, {
        mediaDevice: MediaDevices.MICROPHONE,
        status: PermissionStatus.GRANTED
      });
    } else {
      this._permissionsStatus[MediaDevices.MICROPHONE] = PermissionStatus.DENIED;
      this._scene.emit(MediaDevicesEvents.MIC_SHARE_ENDED);
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

    constraints.audio.echoCancellation = !this._store.state.preferences.disableEchoCancellation;
    constraints.audio.noiseSuppression = !this._store.state.preferences.disableNoiseSuppression;
    constraints.audio.autoGainControl = !this._store.state.preferences.disableAutoGainControl;

    try {
      console.log("Adding microphone media stream");
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.audioSystem.addStreamToOutboundAudio("microphone", newStream);
      this.audioTrack = newStream.getAudioTracks()[0];
      this.audioTrack.addEventListener("ended", async () => {
        this._scene.emit(MediaDevicesEvents.MIC_SHARE_ENDED);
        this.startMicShare({ unmute: this.isMicEnabled });
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

  async startVideoShare({ isDisplayMedia, target, success, error }) {
    let newStream;
    let videoTrackAdded = false;

    try {
      if (isDisplayMedia) {
        newStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            // Work around BMO 1449832 by calculating the width. This will break for multi monitors if you share anything
            // other than your current monitor that has a different aspect ratio.
            width: 720 * (screen.width / screen.height),
            height: 720,
            frameRate: 30
          },
          audio: {
            echoCancellation: window.APP.store.state.preferences.disableEchoCancellation === true ? false : true,
            noiseSuppression: window.APP.store.state.preferences.disableNoiseSuppression === true ? false : true,
            autoGainControl: window.APP.store.state.preferences.disableAutoGainControl === true ? false : true
          }
        });
      } else {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: isIOS ? { max: 1280 } : { max: 1280, ideal: 720 },
            frameRate: 30
          }
          //TODO: Capture audio from camera?
        });
      }

      const videoTracks = newStream ? newStream.getVideoTracks() : [];
      if (videoTracks.length > 0) {
        videoTrackAdded = true;

        newStream.getVideoTracks().forEach(track => {
          // Ideally we would use track.contentHint but it seems to be read-only in Chrome so we just add a custom property
          track["_hubs_contentHint"] = isDisplayMedia ? MediaDevices.SCREEN : MediaDevices.CAMERA;
          track.addEventListener("ended", async () => {
            this._scene.emit(MediaDevicesEvents.VIDEO_SHARE_ENDED);
          });
          this._mediaStream.addTrack(track);
        });

        if (newStream && newStream.getAudioTracks().length > 0) {
          this.audioSystem.addStreamToOutboundAudio("screenshare", newStream);
        }

        await APP.dialog.setLocalMediaStream(this._mediaStream);

        const mediaDevice = isDisplayMedia ? MediaDevices.SCREEN : MediaDevices.CAMERA;
        this._permissionsStatus[mediaDevice] = PermissionStatus.GRANTED;
        this._scene.emit(MediaDevicesEvents.VIDEO_SHARE_STARTED);
        this.emit(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, { mediaDevice, status: PermissionStatus.GRANTED });
      }
    } catch (e) {
      error(e);
      const mediaDevice = isDisplayMedia ? MediaDevices.SCREEN : MediaDevices.CAMERA;
      this._permissionsStatus[mediaDevice] = PermissionStatus.DENIED;
      this._scene.emit(MediaDevicesEvents.VIDEO_SHARE_ENDED);
      this.emit(MediaDevicesEvents.PERMISSIONS_STATUS_CHANGED, { mediaDevice, status: PermissionStatus.DENIED });
      return;
    }

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
    const label = (audioTrack && audioTrack.label) || "";
    if (label.indexOf("Default - ") < 0) {
      return label;
    } else {
      return label.substring(10);
    }
  }

  deviceIdForMicDeviceLabel(label) {
    return this._micDevices.filter(d => d.label === label).map(d => d.value)[0] || this.defaultInputDeviceId;
  }

  deviceIdForSpeakersDeviceLabel(label) {
    return this._outputDevices.filter(d => d.label === label).map(d => d.value)[0] || this.defaultOutputDeviceId;
  }

  micLabelForDeviceId(deviceId) {
    return this._micDevices.filter(d => d.value === deviceId).map(d => d.label)[0];
  }

  speakersLabelForDeviceId(deviceId) {
    return this._outputDevices.filter(d => d.value === deviceId).map(d => d.label)[0];
  }

  hasHmdMicrophone() {
    return !!this.state._micDevices.find(d => HMD_MIC_REGEXES.find(r => d.label.match(r)));
  }

  videoDeviceIdForMicLabel(label) {
    return this._videoDevices.filter(d => d.label === label).map(d => d.value)[0];
  }

  videoLabelForDeviceId(deviceId) {
    return this._videoDevices.filter(d => d.value === deviceId).map(d => d.label)[0];
  }
}
