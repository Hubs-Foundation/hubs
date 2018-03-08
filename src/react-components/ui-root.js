import React, { Component } from 'react';
import PropTypes from 'prop-types';

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
  for (const track of mediaStream.getAudioTracks()) {
    track.stop();
  }

  for (const track of mediaStream.getVideoTracks()) {
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
        <button onClick={this.enter2D}>
          Enter on this Screen
        </button>
        <button onClick={this.enterVR}>
          Enter in VR
        </button>
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
