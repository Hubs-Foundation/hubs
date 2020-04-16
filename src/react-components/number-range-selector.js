import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import styles from "../assets/stylesheets/preferences-screen.scss";

export class NumberRangeSelector extends Component {
  static propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    currentValue: PropTypes.number,
    onChange: PropTypes.func
  };
  state = {
    isDragging: false
  };
  constructor(props) {
    super(props);
    this.myRoot = React.createRef();
    this.stopDragging = this.stopDragging.bind(this);
    this.drag = this.drag.bind(this);
    window.addEventListener("mouseup", this.stopDragging);
    window.addEventListener("mousemove", this.drag);
  }
  componentWillUnmount() {
    window.removeEventListener("mouseup", this.stopDragging);
    window.removeEventListener("mousemove", this.drag);
  }

  stopDragging() {
    this.setState({ isDragging: false });
  }

  drag(e) {
    if (!this.state.isDragging) return;
    const t = Math.max(0, Math.min((e.clientX - this.myRoot.current.offsetLeft) / this.myRoot.current.clientWidth, 1));
    this.props.onChange(this.props.min + t * (this.props.max - this.props.min));
  }

  render() {
    return (
      <div className={classNames(styles.numberWithRange)}>
        <div className={classNames(styles.numberInNumberWithRange)}>
          <input
            type="text"
            value={this.props.currentValue.toFixed(2)}
            onClick={e => {
              e.preventDefault();
              e.target.focus();
              e.target.select();
            }}
            onChange={e => {
              const num = parseInt(e.target.value);
              this.props.onChange(num ? num : 0, true);
            }}
          />
        </div>
        <div
          ref={this.myRoot}
          className={classNames(styles.rangeSlider)}
          onMouseDown={e => {
            e.preventDefault();
            this.setState({ isDragging: true });
            const t = Math.max(
              0,
              Math.min((e.clientX - this.myRoot.current.offsetLeft) / this.myRoot.current.clientWidth, 1)
            );
            this.props.onChange(this.props.min + t * (this.props.max - this.props.min));
          }}
        >
          <input
            type="range"
            step="0.01"
            min={this.props.min}
            max={this.props.max}
            value={this.props.currentValue}
            onChange={e => {
              this.props.onChange(e.target.value);
            }}
          />
        </div>
      </div>
    );
  }
}
