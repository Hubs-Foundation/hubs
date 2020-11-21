import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import styles from "./AvatarEditor.scss";
import { FullscreenLayout } from "../layout/FullscreenLayout";
import { Row } from "../layout/Row";
import { Column } from "../layout/Column";
import { TextInputField } from "../input/TextInputField";
import { InputField } from "../input/InputField";
import { ImageInput } from "../input/ImageInput";
import { AvatarRadioInput } from "../input/AvatarRadioInput";
import { Button } from "../input/Button";
import { CloseButton } from "../input/CloseButton";
import { ToggleInput } from "../input/ToggleInput";
import { IconButton } from "../input/IconButton";
import { ReactComponent as DeleteIcon } from "../icons/Delete.svg";
import { ReactComponent as UploadIcon } from "../icons/Upload.svg";
import { Spinner } from "../misc/Spinner";
import { Center } from "../layout/Center";
import { TextAreaInputField } from "../input/TextAreaInputField";
import { useForm } from "react-hook-form";

export function AvatarEditor({
  debug,
  onClose,
  defaultValues,
  onSubmit,
  loading,
  avatarPreview,
  avatarModels,
  canDelete,
  onDelete,
  showAvatarEditorLink,
  showAvatarPipelinesLink,
  editorLinks
}) {
  const { register, handleSubmit, isSubmitting } = useForm({ defaultValues });

  return (
    <FullscreenLayout
      headerLeft={<CloseButton lg onClick={onClose} />}
      headerCenter={<h3>Avatar Editor</h3>}
      headerRight={
        !loading &&
        canDelete && (
          <IconButton lg onClick={onDelete}>
            <DeleteIcon />
            <p>Delete</p>
          </IconButton>
        )
      }
    >
      {loading ? (
        <Center>
          <Column center>
            <Spinner />
            <p>Loading Avatar...</p>
          </Column>
        </Center>
      ) : (
        <Row as="form" padding="xl" center className={styles.editorContainer} onSubmit={handleSubmit(onSubmit)}>
          <Column center>
            <TextInputField label="Name" name="name" required ref={register} />
            {debug && <TextInputField name="avatar_id" label="Avatar ID" disabled ref={register} />}
            {debug && <TextInputField name="parent_avatar_id" label="Parent Avatar ID" ref={register} />}
            {debug && <TextAreaInputField name="description" label="Description" ref={register} />}
            <InputField label="Model">
              <Column center gap="xs">
                <Row center>
                  {avatarModels.map(({ id, value, label, thumbnailUrl }) => (
                    <AvatarRadioInput
                      key={id}
                      name="parent_avatar_listing_id"
                      value={value}
                      label={label}
                      thumbnailUrl={thumbnailUrl}
                      ref={register}
                    />
                  ))}
                </Row>
                <IconButton as="label" htmlFor="file">
                  <UploadIcon />
                  <p>Custom GLB</p>
                  <input id="file" name="file" type="file" accept="model/gltf+binary,.glb" ref={register} />
                </IconButton>
              </Column>
            </InputField>
            <InputField label="Skin">
              <ImageInput label="Base Map" name="base_map" accepts="image/*" ref={register} />
            </InputField>
            <details className={styles.advancedDetails}>
              <summary>Advanced</summary>
              <Column padding="sm">
                <ImageInput label="Emissive Map" name="emissive_map" accepts="image/*" ref={register} />
                <ImageInput label="Normal Map" name="normal_map" accepts="image/*" ref={register} />
                <ImageInput label="ORM Map" name="orm_map" accepts="image/*" ref={register} />
              </Column>
            </details>
            <InputField label="Share Settings">
              <Column paddingLeft="xs" gap="xs">
                <ToggleInput label="Allow Promotion" name="allow_promotion" ref={register} />
                <ToggleInput
                  label={
                    <>
                      Allow Remixing <span>(under CC-BY 3.0)</span>
                    </>
                  }
                  name="allow_remixing"
                  ref={register}
                />
              </Column>
            </InputField>
            <TextInputField label="Attribution (optional)" name="creatorAttribution" ref={register} />
            <Button preset="accept" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Save"}
            </Button>
          </Column>
          <div className={styles.avatarPreviewContainer}>
            <Column center>
              <div className={styles.avatarPreview}>{avatarPreview}</div>
              {showAvatarEditorLink && (
                <small>
                  <FormattedMessage id="avatar-editor.external-editor-info" />
                  {editorLinks.map(({ name, url }) => (
                    <Fragment key={name}>
                      {" "}
                      <a key={name} target="_blank" rel="noopener noreferrer" href={url}>
                        {name}
                      </a>
                    </Fragment>
                  ))}
                </small>
              )}
              {showAvatarPipelinesLink && (
                <small>
                  <FormattedMessage id="avatar-editor.info" />{" "}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://github.com/MozillaReality/hubs-avatar-pipelines"
                  >
                    <FormattedMessage id="avatar-editor.info-link" />
                  </a>
                </small>
              )}
            </Column>
          </div>
        </Row>
      )}
    </FullscreenLayout>
  );
}

AvatarEditor.propTypes = {
  debug: PropTypes.bool,
  defaultValues: PropTypes.object,
  avatarModels: PropTypes.array.isRequired,
  avatarPreview: PropTypes.node,
  loading: PropTypes.bool,
  onSubmit: PropTypes.func,
  canDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  onClose: PropTypes.func,
  showAvatarEditorLink: PropTypes.bool,
  showAvatarPipelinesLink: PropTypes.bool,
  editorLinks: PropTypes.array
};

AvatarEditor.defaultProps = {
  avatarModels: []
};
