import React, { Component } from 'react';
import PropTypes from 'prop-types';

class UIRoot extends Component {
  static propTypes = {
    enterScene: PropTypes.func,
    mobileVRDeviceCaps: PropTypes.object
  };

  componentDidMount = () => {
    console.log(this.props.mobileVRDeviceCaps);
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
