import React from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";
import { CloseButton } from "../input/CloseButton";
import { TextInputField } from "../input/TextInputField";
import { useForm } from "react-hook-form";
import { ApplyButton } from "../input/Button";
import { FormattedMessage } from "react-intl";
import { Column } from "../layout/Column";

export function AvatarUrlModal({ onSubmit, onClose }) {
  const { handleSubmit, register } = useForm();
  return (
    <Modal title={<FormattedMessage id="avatar-url-modal.title" defaultMessage="Custom Avatar URL" />} beforeTitle={<CloseButton onClick={onClose} />}>
      <Column as="form" padding center onSubmit={handleSubmit(onSubmit)}>
        <TextInputField
          label={<FormattedMessage id="avatar-url-modal.avatar-url-label" defaultMessage="Avatar GLB URL" />}
          placeholder="https://example.com/avatar.glb"
          type="url"
          {...register("url", {
            required: true
          })}
          description={
            <a href="https://docs.hubsfoundation.org/intro-avatars.html" target="_blank" rel="noopener noreferrer">
              <FormattedMessage
                id="avatar-url-modal.custom-avatar-docs-link"
                defaultMessage="Learn more about custom avatars"
              />
            </a>
          }
        />
        <ApplyButton type="submit" />
      </Column>
    </Modal>
  );
}

AvatarUrlModal.propTypes = {
  onSubmit: PropTypes.func,
  onClose: PropTypes.func
};
