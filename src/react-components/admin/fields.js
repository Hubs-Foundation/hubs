import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import LaunchIcon from "@material-ui/icons/Launch";
import { getReticulumFetchUrl } from "./../../utils/phoenix-utils";
import { ReferenceField } from "react-admin";

const styles = {
  ownedFileImage: {
    width: 200,
    height: 150,
    padding: 12
  },

  sceneLink: {},
  avatarLink: {},

  ownedFileImageAspect_square: {
    width: 150,
    height: 150
  },
  ownedFileImageAspect_tall: {
    width: (150 * 9) / 16,
    height: 150
  }
};

export function ConditionalReferenceField(props) {
  const { source, record, defaultValue = false } = props;
  return record && record[source] ? <ReferenceField {...props} /> : defaultValue;
}

const OwnedFileImageInternal = withStyles(styles)(({ record = {}, aspect, classes }) => {
  const src = getReticulumFetchUrl(`/files/${record.owned_file_uuid}`);
  return <img src={src} className={classes[`ownedFileImageAspect_${aspect}`]} />;
});

export const OwnedFileImage = withStyles(styles)(({ basePath, record, source, aspect, classes, defaultImage }) => {
  const defaultValue = defaultImage ? (
    <img src={defaultImage} className={classes[`ownedFileImageAspect_${aspect}`]} />
  ) : (
    false
  );
  return (
    <ConditionalReferenceField
      basePath={basePath}
      source={source}
      reference="owned_files"
      linkType={false}
      record={record}
      defaultValue={defaultValue}
    >
      <OwnedFileImageInternal source="owned_file_uuid" aspect={aspect} />
    </ConditionalReferenceField>
  );
});

OwnedFileImage.propTypes = {
  record: PropTypes.object,
  classes: PropTypes.object
};

export const SceneLink = withStyles(styles)(({ source, record = {}, classes }) => {
  const src = getReticulumFetchUrl(`/scenes/${record.scene_sid || record.scene_listing_sid}`);
  return (
    <a href={src} className={classes.sceneLink} target="_blank" rel="noopener noreferrer">
      {record[source]}
      <LaunchIcon className={classes.icon} />
    </a>
  );
});

SceneLink.propTypes = {
  source: PropTypes.string.isRequired,
  record: PropTypes.object,
  classes: PropTypes.object
};

export const AvatarLink = withStyles(styles)(({ source, record = {}, classes }) => {
  const src = getReticulumFetchUrl(`/api/v1/avatars/${record.avatar_sid || record.avatar_listing_sid}`);
  return (
    <a href={src} className={classes.avatarLink} target="_blank" rel="noopener noreferrer">
      {record[source]}
      <LaunchIcon className={classes.icon} />
    </a>
  );
});

AvatarLink.propTypes = {
  source: PropTypes.string.isRequired,
  record: PropTypes.object,
  classes: PropTypes.object
};
