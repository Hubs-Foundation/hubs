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
    const { record, resource } = this.props;
    if (!(record.allow_promotion || record._allow_promotion)) return false;

    return (
      /* eslint-disable-next-line @calm/react-intl/missing-formatted-message*/
      <Button label="Approve" onClick={this.handleClick}>
        {record[`${resource}_listing_id`] ? "Update" : "Approve"}
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
  withStaticProps({ resource: "scene" })
)(ApproveButton);

export const ApproveAvatarButton = connect(
  null,
  { approveNew: avatarApproveNew, approveExisting: avatarApproveExisting, reviewed: avatarReviewed },
  withStaticProps({ resource: "avatar" })
)(ApproveButton);
