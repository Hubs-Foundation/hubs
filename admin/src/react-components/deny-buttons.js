import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Button from "@material-ui/core/Button";
import { sceneReviewed } from "./scene-actions";
import { avatarReviewed } from "./avatar-actions";

class DenyButton extends Component {
  handleClick = () => {
    const { reviewed, record } = this.props;
    reviewed(record.id);
  };

  render() {
    const { record } = this.props;
    if (!(record.allow_promotion || record._allow_promotion)) return false;

    return (
      <Button label="Deny" onClick={this.handleClick}>
        Deny
      </Button>
    );
  }
}

DenyButton.propTypes = {
  reviewed: PropTypes.func.isRequired,
  record: PropTypes.object
};

export const DenySceneButton = connect(
  null,
  { reviewed: sceneReviewed }
)(DenyButton);

export const DenyAvatarButton = connect(
  null,
  { reviewed: avatarReviewed }
)(DenyButton);
