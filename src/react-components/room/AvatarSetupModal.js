import React from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { BackButton } from "../input/BackButton";
import { AvatarSettingsContent } from "./AvatarSettingsContent";
import { FormattedMessage } from "react-intl";
import styles from "./AvatarSettingsContent.scss";
import classNames from "classnames";

export function AvatarSetupModal({ className, onBack, ...rest }) {
  return (
    <Modal
      title={<FormattedMessage id="avatar-setup-sidebar.title" defaultMessage="Avatar Setup" />}
      //beforeTitle={<BackButton onClick={onBack} />}
      className={classNames(styles.avatarModal, className)}
    >
      <AvatarSettingsContent {...rest} />
    </Modal>
  );
}

AvatarSetupModal.propTypes = {
  className: PropTypes.string,
  onBack: PropTypes.func
};
