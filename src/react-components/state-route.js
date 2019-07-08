import React from "react";
import PropTypes from "prop-types";
import { Route } from "react-router";

/**
 * A react-router Route that looks for a key/value pair in the state to render something.
 */
class StateRoute extends React.Component {
  static propTypes = {
    stateKey: PropTypes.string,
    stateValue: PropTypes.string,
    history: PropTypes.object
  };

  render() {
    const { history, stateKey, stateValue, ...routeProps } = this.props;

    if (
      (!history.location.state && !stateValue) ||
      (history.location.state &&
        (history.location.state[stateKey] === stateValue || (!history.location.state[stateKey] && !stateValue)))
    ) {
      return <Route path="/" {...routeProps} />;
    }

    return null;
  }
}

export default StateRoute;
