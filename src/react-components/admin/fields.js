import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import LaunchIcon from "@material-ui/icons/Launch";
import { getReticulumFetchUrl } from "./../../utils/phoenix-utils";

const styles = {
  ownedFileImage: {
    width: 200,
    height: 150,
    padding: 12
  },

  sceneLink: {}
};

export const OwnedFileImage = withStyles(styles)(({ record = {}, classes }) => {
  const src = getReticulumFetchUrl(`/files/${record.owned_file_uuid}`);
  return <img src={src} className={classes.ownedFileImage} />;
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
