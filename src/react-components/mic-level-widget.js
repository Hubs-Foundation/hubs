import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import MovingAverage from "moving-average";

export default class MicLevelWidget extends Component {
  static propTypes = {
    hasAudioTrack: PropTypes.bool,
    muteOnEntry: PropTypes.bool,
    scene: PropTypes.object
  };

  state = {
    volume: 0
  };

  componentDidMount() {
    this.startAnalyser();
  }

  componentWillUnmount() {
    this.stopAnalyser();
  }

  stopAnalyser() {
    if (this.micUpdateInterval != null) {
      clearInterval(this.micUpdateInterval);
    }
  }

  startAnalyser() {
    if (this.micUpdateInterval) {
      clearInterval(this.micUpdateInterval);
    }
    const micLevelMovingAverage = MovingAverage(100);
    let max = 0;
    this.micUpdateInterval = setInterval(() => {
      const analyser = this.props.scene.systems["local-audio-analyser"];
      max = Math.max(analyser.volume, max);
      // We use a moving average to smooth out the visual animation or else it would twitch too fast for
      // the css renderer to keep up.
      micLevelMovingAverage.push(Date.now(), analyser.volume);
      const average = micLevelMovingAverage.movingAverage();
      const volume = max === 0 ? 0 : average / max;
      if (Math.abs(this.state.volume - volume) > 0.05) {
        this.setState({ volume });
      }
    }, 50);
  }

  render() {
    const maxLevelHeight = 111;

    const micClip = {
      clip: `rect(${maxLevelHeight - Math.floor(this.state.volume * maxLevelHeight)}px, 111px, 111px, 0px)`
    };

    return (
      <div className="audio-setup-panel__levels__icon">
        {!this.props.muteOnEntry && (
          <svg width="111" height="111" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="55.5" cy="55.5" r="55.5" fill="currentColor" fillOpacity="0.8" />
          </svg>
        )}
        {!this.props.muteOnEntry && (
          <div className="audio-setup-panel__levels__icon__talking" style={micClip}>
            <svg width="111" height="111" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="55.5" cy="55.5" r="55.5" fill="currentColor" fillOpacity="0.8" />
            </svg>
          </div>
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
