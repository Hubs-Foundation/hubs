import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Button from "@material-ui/core/Button";
import { sceneApproveNew, sceneApproveExisting, sceneReviewed } from "./scene-actions";

class ApproveSceneButton extends Component {
  handleClick = () => {
    const { sceneApproveNew, sceneApproveExisting, sceneReviewed, record } = this.props;

    if (record.scene_listing_id) {
      sceneApproveExisting(record);
    } else {
      sceneApproveNew(record);
    }

    sceneReviewed(record.id);
  };

  render() {
    return (
      <Button label="Approve" onClick={this.handleClick}>
        Approve
      </Button>
    );
  }
}

ApproveSceneButton.propTypes = {
  sceneApproveNew: PropTypes.func.isRequired,
  sceneApproveExisting: PropTypes.func.isRequired,
  sceneReviewed: PropTypes.func.isRequired,
  record: PropTypes.object
};

export default connect(
  null,
  { sceneApproveNew, sceneApproveExisting, sceneReviewed }
)(ApproveSceneButton);
