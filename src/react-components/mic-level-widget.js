import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import MovingAverage from "moving-average";

const AudioContext = window.AudioContext || window.webkitAudioContext;

export default class MicLevelWidget extends Component {
  static propTypes = {
    mediaStream: PropTypes.object,
    hasAudioTrack: PropTypes.bool,
    muteOnEntry: PropTypes.bool
  };

  state = {
    micLevel: 0
  };

  componentDidMount() {
    if (this.props.mediaStream != null && this.props.hasAudioTrack) {
      this.startAnalyzer(this.props.mediaStream);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.mediaStream !== prevProps.mediaStream || this.props.hasAudioTrack !== prevProps.hasAudioTrack) {
      this.stopAnalyzer();
      if (this.props.mediaStream != null && this.props.hasAudioTrack) {
        this.startAnalyzer(this.props.mediaStream);
      }
    }
  }

  componentWillUnmount() {
    this.stopAnalyzer();
  }

  stopAnalyzer() {
    if (this.micUpdateInterval != null) {
      clearInterval(this.micUpdateInterval);
    }
    if (this.micLevelAudioContext != null) {
      this.micLevelAudioContext.close();
    }
  }

  startAnalyzer(mediaStream) {
    this.micLevelAudioContext = new AudioContext();
    const micSource = this.micLevelAudioContext.createMediaStreamSource(mediaStream);
    const analyser = this.micLevelAudioContext.createAnalyser();
    analyser.fftSize = 32;
    const levels = new Uint8Array(analyser.frequencyBinCount);
    micSource.connect(analyser);
    const micLevelMovingAverage = MovingAverage(100);
    this.micUpdateInterval = setInterval(() => {
      analyser.getByteTimeDomainData(levels);
      let v = 0;
      for (let x = 0; x < levels.length; x++) {
        v = Math.max(levels[x] - 128, v);
      }
      const level = v / 128.0;
      // Multiplier to increase visual indicator.
      const multiplier = 6;
      // We use a moving average to smooth out the visual animation or else it would twitch too fast for
      // the css renderer to keep up.
      micLevelMovingAverage.push(Date.now(), level * multiplier);
      const average = micLevelMovingAverage.movingAverage();
      this.setState(state => {
        if (Math.abs(average - state.micLevel) > 0.0001) {
          return { micLevel: average };
        }
      });
    }, 50);
  }

  render() {
    const maxLevelHeight = 111;
    const micClip = {
      clip: `rect(${maxLevelHeight - Math.floor(this.state.micLevel * maxLevelHeight)}px, 111px, 111px, 0px)`
    };

    return (
      <div className="audio-setup-panel__levels__icon">
        <img
          src="../assets/images/level_background.png"
          srcSet="../assets/images/level_background@2x.png 2x"
          className="audio-setup-panel__levels__icon-part"
        />
        {!this.props.muteOnEntry && (
          <img
            src="../assets/images/level_fill.png"
            srcSet="../assets/images/level_fill@2x.png 2x"
            className="audio-setup-panel__levels__icon-part"
            style={micClip}
          />
        )}
        {this.props.hasAudioTrack && !this.props.muteOnEntry ? (
          <img
            src="../assets/images/mic_level.png"
            srcSet="../assets/images/mic_level@2x.png 2x"
            className="audio-setup-panel__levels__icon-part"
          />
        ) : (
          <img
            src="../assets/images/mic_denied.png"
            srcSet="../assets/images/mic_denied@2x.png 2x"
            className="audio-setup-panel__levels__icon-part"
          />
        )}
        {this.props.hasAudioTrack &&
          !this.props.muteOnEntry && (
            <div className="audio-setup-panel__levels__test_label">
              <FormattedMessage id="audio.talk_to_test" />
            </div>
          )}
      </div>
    );
  }
}
