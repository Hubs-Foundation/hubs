import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Button from "@material-ui/core/Button";
import { sceneListingUnfeature } from "./scene-actions";

class UnfeatureSceneListingButton extends Component {
  handleClick = () => {
    const { sceneListingUnfeature, record } = this.props;
    sceneListingUnfeature(record.id, record);
  };

  render() {
    return (
      <Button label="Unfeature" onClick={this.handleClick}>
        Unfeature
      </Button>
    );
  }
}

UnfeatureSceneListingButton.propTypes = {
  sceneListingUnfeature: PropTypes.func.isRequired,
  record: PropTypes.object
};

export default connect(
  null,
  { sceneListingUnfeature }
)(UnfeatureSceneListingButton);
