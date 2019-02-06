import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Button from "@material-ui/core/Button";
import { sceneReviewed } from "./scene-actions";

class DenySceneButton extends Component {
  handleClick = () => {
    const { sceneReviewed, record } = this.props;
    sceneReviewed(record.id);
  };

  render() {
    return (
      <Button label="Deny" onClick={this.handleClick}>
        Deny
      </Button>
    );
  }
}

DenySceneButton.propTypes = {
  sceneReviewed: PropTypes.func.isRequired,
  record: PropTypes.object
};

export default connect(
  null,
  { sceneReviewed }
)(DenySceneButton);
