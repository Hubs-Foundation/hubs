import React from "react";
import { AvatarLink, OwnedFileImage, ConditionalReferenceField } from "./fields";
import { ApproveAvatarButton } from "./approve-buttons";
import { DenyAvatarButton } from "./deny-buttons";
import { ToolbarWithoutDelete } from "./toolbar-without-delete";

import {
  List,
  Edit,
  SimpleForm,
  TextInput,
  EditButton,
  SelectInput,
  BooleanInput,
  Datagrid,
  TextField,
  DateField,
  BooleanField,
  Filter
} from "react-admin";
import { withStyles } from "@material-ui/core/styles";

// Quite ugly but simplest way to have AvatarPreview work is to import aframe.
// We can technically untangle the dependencies for this, but doesn't seem worth it for admin.
import "aframe";
import AvatarPreview from "./avatar-preview";
import { getReticulumFetchUrl } from "hubs/src/utils/phoenix-utils";

const AvatarFilter = props => (
  <Filter {...props}>
    <TextInput label="Search Name" source="name" alwaysOn />
    <TextInput label="Search SID" source="avatar_sid" alwaysOn />
  </Filter>
);

export const AvatarEdit = props => (
  <Edit {...props}>
    <SimpleForm toolbar={<ToolbarWithoutDelete />}>
      <TextInput source="name" />
      <TextInput source="description" />
      <TextInput source="attributions" />
      <SelectInput source="state" choices={[{ id: "active", name: "active" }, { id: "removed", name: "removed" }]} />
      <BooleanInput source="allow_remixing" />
      <BooleanInput source="allow_promotion" />
    </SimpleForm>
  </Edit>
);

const styles = {
  preview: {
    height: 200,
    width: 200 * (9 / 16)
  }
};

const Preview = withStyles(styles)(({ record, classes, source = "avatar_sid" }) => (
  <AvatarPreview
    className={classes.preview}
    avatarGltfUrl={getReticulumFetchUrl(`/api/v1/avatars/${record[source]}/avatar.gltf?v=${record.updated_at}`)}
  />
));

const rowStyle = record => ({
  opacity: record.state === "removed" ? 0.3 : 1
});

export const AvatarList = props => (
  <List {...props} filters={<AvatarFilter />} bulkActionButtons={false}>
    <Datagrid rowStyle={rowStyle}>
      <ConditionalReferenceField label="live thumbnail" reference="avatar_listings" source="avatar_listing_id">
        <OwnedFileImage
          source="thumbnail_owned_file_id"
          aspect="tall"
          defaultImage="https://asset-bundles-prod.reticulum.io/bots/avatar_unavailable.png"
        />
      </ConditionalReferenceField>
      <ConditionalReferenceField label="live preview" reference="avatar_listings" source="avatar_listing_id">
        <Preview source="avatar_listing_sid" />
      </ConditionalReferenceField>
      <ConditionalReferenceField label="live name" reference="avatar_listings" source="avatar_listing_id">
        <TextField source="name" />
      </ConditionalReferenceField>
      <span> ➡ </span>
      <OwnedFileImage
        label="thumbnail"
        source="thumbnail_owned_file_id"
        aspect="tall"
        defaultImage="https://asset-bundles-prod.reticulum.io/bots/avatar_unavailable.png"
      />
      <Preview label="preview" />
      <TextField source="name" />
      <TextField source="account_id" />
      <AvatarLink source="avatar_sid" />
      <ConditionalReferenceField reference="avatar_listings" source="parent_avatar_listing_id">
        <TextField source="name" />
      </ConditionalReferenceField>
      <OwnedFileImage source="base_map_owned_file_id" aspect="square" />
      <OwnedFileImage source="emissive_map_owned_file_id" aspect="square" />
      <OwnedFileImage source="normal_map_owned_file_id" aspect="square" />
      <OwnedFileImage source="orm_map_owned_file_id" aspect="square" />
      <TextField source="attributions" />
      <BooleanField source="allow_remixing" />
      <DateField source="updated_at" />
      <EditButton />
      <ApproveAvatarButton />
      <DenyAvatarButton />
    </Datagrid>
  </List>
);
