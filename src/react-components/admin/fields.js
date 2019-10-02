import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import LaunchIcon from "@material-ui/icons/Launch";
import { getReticulumFetchUrl } from "./../../utils/phoenix-utils";
import { ReferenceField } from "react-admin";

const styles = {
  ownedFileImage: {},

  sceneLink: {},
  avatarLink: {},

  ownedFileImageAspect_square: {
    width: 150,
    height: 150,
    padding: 12
  },
  ownedFileImageAspect_wide: {
    width: 200,
    height: 150,
    padding: 12
  },
  ownedFileImageAspect_tall: {
    width: (150 * 9) / 16,
    height: 150,
    padding: 12
  }
};

export function ConditionalReferenceField(props) {
  const { source, record, defaultValue = <div /> } = props;
  return record && record[source] ? <ReferenceField {...props} /> : defaultValue;
}

ConditionalReferenceField.propTypes = {
  ...ReferenceField.propTypes,
  defaultValue: PropTypes.element
};

const OwnedFileImageInternal = withStyles(styles)(({ record = {}, aspect = "wide", classes }) => {
  const src = getReticulumFetchUrl(`/files/${record.owned_file_uuid}`);
  return <img src={src} className={classes[`ownedFileImageAspect_${aspect}`]} />;
});

export const OwnedFileImage = withStyles(styles)(({ basePath, record, source, aspect, classes, defaultImage }) => {
  return (
    <ConditionalReferenceField
      basePath={basePath}
      source={source}
      reference="owned_files"
      linkType={false}
      record={record}
      defaultValue={defaultImage && <img src={defaultImage} className={classes[`ownedFileImageAspect_${aspect}`]} />}
    >
      <OwnedFileImageInternal source="owned_file_uuid" aspect={aspect} />
    </ConditionalReferenceField>
  );
});

OwnedFileImage.propTypes = {
  record: PropTypes.object,
  classes: PropTypes.object
};

function OwnedFileDownloadFieldInternal({ fileName, record, source }) {
  return (
    <a
      download={fileName || true}
      href={getReticulumFetchUrl(`/files/${record[source]}`)}
      target="_blank"
      rel="noopener noreferrer"
    >
      Download
    </a>
  );
}

OwnedFileDownloadFieldInternal.propTypes = {
  record: PropTypes.object,
  fileName: PropTypes.string,
  source: PropTypes.string
};

export function OwnedFileDownloadField({ getFileName, ...props }) {
  const fileName = getFileName && getFileName(props);

  return (
    <ConditionalReferenceField
      reference="owned_files"
      linkType={false}
      defaultValue={<a href="#">Download</a>}
      {...props}
    >
      <OwnedFileDownloadFieldInternal source="owned_file_uuid" fileName={fileName} />
    </ConditionalReferenceField>
  );
}

OwnedFileDownloadField.propTypes = {
  getFileName: PropTypes.func,
  record: PropTypes.object,
  source: PropTypes.string
};

OwnedFileDownloadField.defaultProps = {
  addLabel: true
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
  const src = getReticulumFetchUrl(`/avatars/${record.avatar_sid || record.avatar_listing_sid}`);
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
