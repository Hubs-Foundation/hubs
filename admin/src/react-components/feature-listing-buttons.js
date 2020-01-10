import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Button from "@material-ui/core/Button";
import { listingFeature, listingUnfeature } from "./listing-actions";

const isFeatured = record => (record.tags ? (record.tags.tags || []).includes("featured") : false);

function FeatureListingButton(props) {
  const { feature, unfeature, record, resource } = props;
  const featured = isFeatured(record);
  const label = featured ? "Unfeature" : "Feature";
  return (
    <Button label={label} onClick={() => (featured ? unfeature : feature)(resource, record.id, record)}>
      {label}
    </Button>
  );
}

FeatureListingButton.propTypes = {
  feature: PropTypes.func.isRequired,
  unfeature: PropTypes.func.isRequired,
  resource: PropTypes.string.isRequired,
  record: PropTypes.object
};

const withStaticProps = staticProps => (stateProps, dispatchProps, ownProps) => ({
  ...ownProps,
  ...stateProps,
  ...dispatchProps,
  ...staticProps
});

export const FeatureSceneListingButton = connect(
  null,
  { feature: listingFeature, unfeature: listingUnfeature },
  withStaticProps({ resource: "scene_listings" })
)(FeatureListingButton);

export const FeatureAvatarListingButton = connect(
  null,
  { feature: listingFeature, unfeature: listingUnfeature },
  withStaticProps({ resource: "avatar_listings" })
)(FeatureListingButton);
