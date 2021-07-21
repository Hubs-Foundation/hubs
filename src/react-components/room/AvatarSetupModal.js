import React from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { BackButton } from "../input/BackButton";
import { AvatarSettingsContent } from "./AvatarSettingsContent";
import { FormattedMessage } from "react-intl";
import styles from "./AvatarSettingsContent.scss";
import { stylemodal } from "../modal/Modal.scss";
import classNames from "classnames";

export function AvatarSetupModal({ className, onBack, ...rest }) {
  return (
    <Modal
      //title={<FormattedMessage id="avatar-setup-sidebar.title" defaultMessage="Avatar" />}
      beforeTitle={<BackButton onClick={onBack} />}
      className={classNames(styles.avatarModal)}
    >
      <AvatarSettingsContent {...rest} />
    </Modal>
  );
}

AvatarSetupModal.propTypes = {
  className: PropTypes.string,
  onBack: PropTypes.func
};
