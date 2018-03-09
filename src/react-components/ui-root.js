import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { VR_DEVICE_AVAILABILITY } from "../utils/vr-caps-detect.js";

const ENTRY_STEPS = {
  start: "start",
  mic_grant: "mic_grant",
  audio_setup: "audio_setup",
  finished: "finished"
}

async function grantedMicLabels() {
  const mediaDevices = await navigator.mediaDevices.enumerateDevices();
  return mediaDevices.filter(d => d.label && d.kind === "audioinput").map(d => d.label);
}

async function hasGrantedMicPermissions() {
  const micLabels = await grantedMicLabels();
  return micLabels.length > 0;
}

function stopAllTracks(mediaStream) {
  for (const track of mediaStream.getAudioTracks()) {
    track.stop();
  }

  for (const track of mediaStream.getVideoTracks()) {
    track.stop();
  }
}

const TwoDEntryButton = (props) => (
  <button {...props}>
    Enter on this Screen
  </button>
);

const GenericEntryButton = (props) => (
  <button {...props}>
    Enter in VR
  </button>
);

const GearVREntryButton = (props) => (
  <button {...props}>
    Enter on GearVR
  </button>
);

const DaydreamEntryButton = (props) => (
  <button {...props}>
    Enter on Daydream
  </button>
);

// This is a list of regexes that match the microphone labels of HMDs.
//
// If entering VR mode, and if any of these regexes match an audio device,
// the user will be prevented from entering VR until one of those devices is
// selected as the microphone.
//
// Note that this doesn't have to be exhaustive: if no devices match any regex
// then we rely upon the user to select the proper mic.
const VR_DEVICE_MIC_LABEL_REGEXES = [];

class UIRoot extends Component {
  static propTypes = {
    enterScene: PropTypes.func,
    availableVREntryTypes: PropTypes.object
  };

  state = {
    entryStep: ENTRY_STEPS.start,
    shareScreen: false,
    enterInVR: false,
    micDevices: [],
    mediaStream: null,
  }

  performDirectEntryFlow = async (enterInVR) => {
    this.setState({ enterInVR })

    const hasGrantedMic = await hasGrantedMicPermissions();

    if (hasGrantedMic) {
      await this.setMediaStreamToDefault();
      await this.beginAudioSetup();
    } else {
      this.setState({ entryStep: ENTRY_STEPS.mic_grant });
    }
  }

  enter2D = async () => {
    await this.performDirectEntryFlow(false);
  }

  enterVR = async () => {
    await this.performDirectEntryFlow(true);
  }

  enterGearVR = async () => {
    console.log("gear");
  }

  enterDaydream = async () => {
    console.log("daydream");
  }

  mediaVideoConstraint = () => {
    return this.state.shareScreen ? { mediaSource: "screen", height: 720, frameRate: 30 } : false;
  }

  micDeviceChanged = async (ev) => {
    const constraints = { audio: { deviceId: { exact: [ev.target.value] } }, video: this.mediaVideoConstraint() };
    if (this.state.mediaStream) {
      stopAllTracks(this.state.mediaStream);
    }

    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.setState({ mediaStream });
  }

  setMediaStreamToDefault = async () => {
    const constraints = { audio: true, video: this.mediaVideoConstraint() };
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.setState({ mediaStream });
  }

  onMicGrantButton = async () => {
    await this.setMediaStreamToDefault();
    await this.beginAudioSetup();
  }

  beginAudioSetup = async () => {
    await this.fetchMicDevices();
    this.setState({ entryStep: ENTRY_STEPS.audio_setup });
  }

  fetchMicDevices = async () => {
    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    this.setState({ micDevices: mediaDevices.filter(d => d.kind === "audioinput").map(d => ({ deviceId: d.deviceId, label: d.label }))});
  }

  onAudioReadyButton = async () => {
    if (this.state.enterInVR) {
      document.querySelector("a-scene").enterVR();
    }

    const mediaStream = this.state.mediaStream;

    if (mediaStream) {
      if (mediaStream.getAudioTracks().length > 0) {
        console.log(`Using microphone: ${mediaStream.getAudioTracks()[0].label}`)
      }

      if (mediaStream.getVideoTracks().length > 0) {
        console.log('Screen sharing enabled.')
      }
    }

    this.props.enterScene(mediaStream);
    this.setState({ entryStep: ENTRY_STEPS.finished });
  }

  componentDidMount = () => {
    console.log(this.props.availableVREntryTypes);
  }

  render() {
    const entryPanel = this.state.entryStep === ENTRY_STEPS.start 
    ? (
      <div>
        <TwoDEntryButton onClick={this.enter2D}/>
        { this.props.availableVREntryTypes.generic !== VR_DEVICE_AVAILABILITY.no && <GenericEntryButton onClick={this.enterVR}/> }
        { this.props.availableVREntryTypes.gearvr !== VR_DEVICE_AVAILABILITY.no && <GearVREntryButton onClick={this.enterGearVR}/> }
        { this.props.availableVREntryTypes.daydream !== VR_DEVICE_AVAILABILITY.no && <DaydreamEntryButton onClick={this.enterDaydream}/> }
      </div>
    ) : null;

    const micPanel = this.state.entryStep === ENTRY_STEPS.mic_grant
    ? (
        <div>
          <button onClick={this.onMicGrantButton}>
            Grant Mic
          </button>
        </div>
      ) : null;

    const selectedMicLabel = (this.state.mediaStream
                                 && this.state.mediaStream.getAudioTracks().length > 0
                                 && this.state.mediaStream.getAudioTracks()[0].label) || "";

    const selectedMicDeviceId = this.state.micDevices.filter(d => d.label === selectedMicLabel).map(d => d.deviceId)[0];

    const audioSetupPanel = this.state.entryStep === ENTRY_STEPS.audio_setup
    ? (
        <div>
          Audio setup
          <select value={selectedMicDeviceId} onChange={this.micDeviceChanged}>
            { this.state.micDevices.map(d => (<option key={ d.deviceId } value={ d.deviceId }>{d.label}</option>)) }
          </select>
          <button onClick={this.onAudioReadyButton}>
            Audio Ready
          </button>
        </div>
      ) : null;

    return (
      <div>
        UI Here
        {entryPanel}
        {micPanel}
        {audioSetupPanel}
      </div>
    );
  }
}

export default UIRoot;
