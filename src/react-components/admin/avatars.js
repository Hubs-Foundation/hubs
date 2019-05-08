import React from "react";
import { AvatarLink, OwnedFileImage, ConditionalReferenceField } from "./fields";
import { ApproveAvatarButton } from "./approve-scene-button";
import { DenyAvatarButton } from "./deny-scene-button";

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

const AvatarFilter = props => (
  <Filter {...props}>
    <TextInput label="Search Name" source="name" alwaysOn />
    <TextInput label="Search SID" source="avatar_sid" alwaysOn />
  </Filter>
);

export const AvatarEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <TextInput source="description" />
      <TextInput source="attributions" />
      <SelectInput source="state" choices={[{ id: "active", name: "active" }, { id: "removed", name: "removed" }]} />
      <BooleanInput source="allow_remixing" />
      <BooleanInput source="allow_promotion" />
    </SimpleForm>
  </Edit>
);

const rowStyle = record => ({
  opacity: record.state === "removed" ? 0.3 : 1
});

export const AvatarList = props => (
  <List {...props} filters={<AvatarFilter />} bulkActionButtons={false}>
    <Datagrid rowStyle={rowStyle}>
      <OwnedFileImage
        source="thumbnail_owned_file_id"
        aspect="tall"
        defaultImage="https://asset-bundles-prod.reticulum.io/bots/avatar_unavailable.png"
      />
      <TextField source="name" />
      <AvatarLink source="avatar_sid" />
      <ConditionalReferenceField reference="avatars" source="parent_avatar_id">
        <TextField source="name" />
      </ConditionalReferenceField>
      <ConditionalReferenceField reference="avatar_listings" source="parent_avatar_listing_id">
        <TextField source="name" />
      </ConditionalReferenceField>
      <OwnedFileImage source="base_map_owned_file_id" aspect="square" />
      <OwnedFileImage source="emissive_map_owned_file_id" aspect="square" />
      <OwnedFileImage source="normal_map_owned_file_id" aspect="square" />
      <OwnedFileImage source="orm_map_owned_file_id" aspect="square" />

      <BooleanField source="allow_remixing" />
      <BooleanField source="allow_promotion" />
      <TextField source="reviewed_at" />
      <DateField source="inserted_at" />
      <DateField source="updated_at" />
      <TextField source="state" />
      <EditButton />
      <ApproveAvatarButton />
      <DenyAvatarButton />
    </Datagrid>
  </List>
);
