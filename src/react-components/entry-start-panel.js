import { Component } from "react";
import PropTypes from "prop-types";

// this component is currently just being used for its componentDidMount
// TODO migrate render from ui-root.js renderEntryStartPanel()
export default class EntryStartPanel extends Component {
  static propTypes = {
    entering: PropTypes.bool,
    onEnteringCanceled: PropTypes.func
  };

  componentDidMount() {
    if (this.props.entering) {
      this.props.onEnteringCanceled();
    }
  }

  render() {
    return null;
  }
}
