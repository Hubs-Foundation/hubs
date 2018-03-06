import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getPreEntryMobileVRDeviceCaps } from "../utils/vr-caps-detect.js"

class UIRoot extends Component {
  static propTypes = {
    enterScene: PropTypes.func
  };

  componentDidMount = () => {
    getPreEntryMobileVRDeviceCaps().then(x => console.log(x))
  }

  render() {
    return (
      <button onClick={this.props.enterScene}>
        Hello World!
      </button>
    );
  }
}

export default UIRoot;
