import React from "react";
import PropTypes from "prop-types";
import { pushHistoryState, replaceHistoryState } from "../utils/history";

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

/**
 * A history-aware link that pushes/replaces the state, but not the path, in the browser history.
 */
class StateLink extends React.Component {
  static propTypes = {
    history: PropTypes.object,
    innerRef: PropTypes.object,
    replace: PropTypes.bool,
    stateKey: PropTypes.string,
    stateValue: PropTypes.string,
    stateDetail: PropTypes.object,
    target: PropTypes.string,
    title: PropTypes.string,
    onClick: PropTypes.func,
    children: PropTypes.node,
    className: PropTypes.string
  };

  async handleClick(event, history) {
    if (this.props.onClick) this.props.onClick(event);

    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0 && // ignore everything but left clicks
      (!this.props.target || this.props.target === "_self") && // let browser handle "target=_blank" etc.
      !isModifiedEvent(event) // ignore clicks with modifier keys
    ) {
      event.preventDefault();
      const method = this.props.replace ? replaceHistoryState : pushHistoryState;
      method(history, this.props.stateKey, this.props.stateValue, this.props.stateDetail);
    }
  }

  render() {
    const { innerRef, target, className, title, children } = this.props;
    return (
      <a
        target={target}
        className={className}
        title={title}
        role="button"
        onClick={event => this.handleClick(event, this.props.history)}
        href="#"
        ref={innerRef}
      >
        {children}
      </a>
    );
  }
}

export default StateLink;
