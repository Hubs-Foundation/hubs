import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Button from "@material-ui/core/Button";
import { sceneListingFeature } from "./scene-actions";

class FeatureSceneListingButton extends Component {
  handleClick = () => {
    const { sceneListingFeature, record } = this.props;
    sceneListingFeature(record.id, record);
  };

  render() {
    if (this.props.record.tags.tags && this.props.record.tags.tags.includes("featured")) return null;

    return (
      <Button label="Feature" onClick={this.handleClick}>
        Feature
      </Button>
    );
  }
}

FeatureSceneListingButton.propTypes = {
  sceneListingFeature: PropTypes.func.isRequired,
  record: PropTypes.object
};

export default connect(
  null,
  { sceneListingFeature }
)(FeatureSceneListingButton);
