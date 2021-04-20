import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./ObjectsSidebar.scss";
import { Sidebar } from "../sidebar/Sidebar";
import { CloseButton } from "../input/CloseButton";
import { ButtonListItem } from "../layout/List";
import listStyles from "../layout/List.scss";
import { ReactComponent as ObjectIcon } from "../icons/Object.svg";
import { ReactComponent as ImageIcon } from "../icons/Image.svg";
import { ReactComponent as VideoIcon } from "../icons/Video.svg";
import { ReactComponent as AudioIcon } from "../icons/Audio.svg";
import { ReactComponent as TextDocumentIcon } from "../icons/TextDocument.svg";
import { defineMessages, FormattedMessage, useIntl } from "react-intl";

function getObjectIcon(type) {
  switch (type) {
    case "video":
      return VideoIcon;
    case "audio":
      return AudioIcon;
    case "image":
      return ImageIcon;
    case "pdf":
      return TextDocumentIcon;
    case "model":
    default:
      return ObjectIcon;
  }
}

const objectTypeNames = defineMessages({
  video: { id: "objects-sidebar.object-type.video", defaultMessage: "Video" },
  audio: { id: "objects-sidebar.object-type.audio", defaultMessage: "Audio" },
  image: { id: "objects-sidebar.object-type.image", defaultMessage: "Image" },
  pdf: { id: "objects-sidebar.object-type.pdf", defaultMessage: "PDF" },
  model: { id: "objects-sidebar.object-type.model", defaultMessage: "Model" },
  default: { id: "objects-sidebar.object-type.default", defaultMessage: "Object" }
});

export function ObjectsSidebarItem({ selected, object, ...rest }) {
  const intl = useIntl();
  const ObjectTypeIcon = getObjectIcon(object.type);

  return (
    <ButtonListItem
      {...rest}
      className={classNames(styles.object, { [listStyles.selected]: selected })}
      type="button"
      aria-label={intl.formatMessage(
        { id: "objects-sidebar.object-label", defaultMessage: "{objectType}: {objectName}" },
        {
          objectType: intl.formatMessage(objectTypeNames[object.type] || objectTypeNames.default),
          objectName: object.name
        }
      )}
    >
      <ObjectTypeIcon />
      <p>{object.name}</p>
    </ButtonListItem>
  );
}

ObjectsSidebarItem.propTypes = {
  selected: PropTypes.bool,
  object: PropTypes.shape({
    id: PropTypes.any.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string
  })
};

export function NoObjects({ canAddObjects }) {
  return (
    <li className={styles.noObjects}>
      <p>
        <FormattedMessage id="objects-sidebar.no-objects" defaultMessage="There are no objects in the room." />
      </p>
      {canAddObjects && (
        <p>
          <FormattedMessage id="objects-sidebar.place-menu-tip" defaultMessage="Use the place menu to add objects." />
        </p>
      )}
    </li>
  );
}

NoObjects.propTypes = {
  canAddObjects: PropTypes.bool
};

export function ObjectsSidebar({ children, objectCount, onClose }) {
  return (
    <Sidebar
      title={
        <FormattedMessage
          id="objects-sidebar.title"
          defaultMessage="Objects ({objectCount})"
          values={{ objectCount }}
        />
      }
      beforeTitle={<CloseButton onClick={onClose} />}
    >
      <ul>{children}</ul>
    </Sidebar>
  );
}

ObjectsSidebar.propTypes = {
  objectCount: PropTypes.number.isRequired,
  children: PropTypes.node,
  onClose: PropTypes.func
};

ObjectsSidebar.defaultProps = {
  objectCount: 0
};
