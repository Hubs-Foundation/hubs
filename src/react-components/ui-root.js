import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { VR_DEVICE_AVAILABILITY } from "../utils/vr-caps-detect.js";

const ENTRY_STEPS = {
  start: "start",
  mic_check: "mic_check",
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
  for (const track of mediaStream.tracks) {
    track.stop();
  }
}

async function getMediaStream(shareScreen, ...desiredMicRegexes) {
  let mediaStream = null;
  let desiredAudioDeviceIds;

  const mediaStreamHasDesiredMic = () => {
    if (!mediaStream || mediaStream.getAudioTracks().length == 0) return false;
    if (desiredMicRegexes.length == 0) return true;

    return !!(desiredMicRegexes.find(r => mediaStream.getAudioTracks()[0].label.match(r)));
  };

  do {
    if (mediaStream) {
      stopAllTracks(mediaStream);
    }

    const mediaDevices = await navigator.mediaDevices.enumerateDevices();

    desiredAudioDeviceIds = mediaDevices.filter(d => {
      return desiredMicRegexes.find(r => d.label.match(r)) && d.kind === "audioinput";
    }).map(d => d.deviceId);

    const constraints = {
      audio: desiredAudioDeviceIds.length > 0 ? { deviceId: { exact: desiredAudioDeviceIds } } : true,
      video: shareScreen ? { mediaSource: "screen", height: 720, frameRate: 30 } : false
    };

    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
  } while (!mediaStreamHasDesiredMic() && desiredAudioDeviceIds.length > 0);

  return mediaStream;
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

class UIRoot extends Component {
  static propTypes = {
    enterScene: PropTypes.func,
    availableVREntryTypes: PropTypes.object
  };

  state = {
    entryStep: ENTRY_STEPS.start,
    shareScreen: false
  }

  performDirectEntryFlow = async (enterInVR) => {
    if (enterInVR) {
      // Have to do this
      document.querySelector("a-scene").enterVR();
    }

    const hasMic = await hasGrantedMicPermissions();

    if (hasMic) {
      await this.getMediaStreamAndEnterScene();
    } else {
      this.setState({ entryStep: ENTRY_STEPS.mic_check });
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

  getMediaStreamAndEnterScene = async (...desiredMicRegexes) => {
    const preStreamAcquisitionTime = new Date();
    const mediaStream = await getMediaStream(this.state.shareScreen, ...desiredMicRegexes);

    if (mediaStream) {
      if (mediaStream.getAudioTracks().length > 0) {
        console.log(`Using microphone: ${mediaStream.getAudioTracks()[0].label}`)
      }

      if (mediaStream.getVideoTracks().length > 0) {
        console.log('Screen sharing enabled.')
      }
    }

    this.setState({ entryStep: ENTRY_STEPS.finished });
    this.props.enterScene(mediaStream);
  }

  onMicActivateButtonClicked = async () => {
    await this.getMediaStreamAndEnterScene();
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

    const micPanel = this.state.entryStep === ENTRY_STEPS.mic_check
    ? (
        <div>
          <button onClick={this.onMicActivateButtonClicked}>
            Choose Mic
          </button>
        </div>
      ) : null;

    return (
      <div>
        UI Here
        {entryPanel}
        {micPanel}
      </div>
    );
  }
}

export default UIRoot;
