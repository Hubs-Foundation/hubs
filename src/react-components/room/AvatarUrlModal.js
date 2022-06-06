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
  const handleChange = () => {
    console.log('handle change called');
    document.getElementById('btnSubmitAvatar').click();
  }
  return (
    <Modal title="Custom Avatar URL" beforeTitle={<CloseButton onClick={onClose} />}>
      <Column as="form" padding center onSubmit={handleSubmit(onSubmit)}>
        <TextInputField
          name="url"
          label={<FormattedMessage id="avatar-url-modal.avatar-url-label" defaultMessage="Avatar GLB URL" />}
          placeholder="https://example.com/avatar.glb"
          type="url"
          required
          onChange={handleChange}
          ref={register}
        />
        <ApplyButton type="submit" id="btnSubmitAvatar"/>
      </Column>
    </Modal>
  );
}



AvatarUrlModal.propTypes = {
  onSubmit: PropTypes.func,
  onClose: PropTypes.func
};
