import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Button from "@material-ui/core/Button";
import { sceneApproveNew, sceneApproveExisting, sceneReviewed } from "./scene-actions";
import { avatarApproveNew, avatarApproveExisting, avatarReviewed } from "./avatar-actions";

class ApproveButton extends Component {
  handleClick = () => {
    const { approveNew, approveExisting, reviewed, record, resource } = this.props;

    if (record[`${resource}_listing_id`]) {
      approveExisting(record);
    } else {
      approveNew(record);
    }

    reviewed(record.id);
  };

  render() {
    const { record } = this.props;
    if (!record.allow_promotion) return false;

    return (
      <Button label="Approve" onClick={this.handleClick}>
        Approve
      </Button>
    );
  }
}

ApproveButton.propTypes = {
  approveNew: PropTypes.func.isRequired,
  approveExisting: PropTypes.func.isRequired,
  reviewed: PropTypes.func.isRequired,
  resource: PropTypes.string.isRequired,
  record: PropTypes.object
};

const withStaticProps = staticProps => (stateProps, dispatchProps, ownProps) => ({
  ...ownProps,
  ...stateProps,
  ...dispatchProps,
  ...staticProps
});

export const ApproveSceneButton = connect(
  null,
  { approveNew: sceneApproveNew, approveExisting: sceneApproveExisting, reviewed: sceneReviewed },
  withStaticProps({ resource: "scenes" })
)(ApproveButton);

export const ApproveAvatarButton = connect(
  null,
  { approveNew: avatarApproveNew, approveExisting: avatarApproveExisting, reviewed: avatarReviewed },
  withStaticProps({ resource: "avatars" })
)(ApproveButton);
