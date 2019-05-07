import React from "react";
import { AvatarLink, OwnedFileImage, ConditionalReferenceField } from "./fields";
import { FeatureAvatarListingButton } from "./feature-scene-listing-button";

import {
  List,
  Edit,
  SimpleForm,
  TextInput,
  EditButton,
  SelectInput,
  Datagrid,
  TextField,
  DateField,
  BooleanField,
  Filter
} from "react-admin";

const AvatarListingFilter = props => (
  <Filter {...props}>
    <TextInput label="Search Name" source="name" alwaysOn />
    <TextInput label="Search SID" source="avatar_listing_sid" alwaysOn />
  </Filter>
);

export const AvatarListingEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <TextInput source="description" />
      <SelectInput source="state" choices={[{ id: "active", name: "active" }, { id: "delisted", name: "delisted" }]} />
    </SimpleForm>
  </Edit>
);

const rowStyle = record => ({
  opacity: record.state === "delisted" ? 0.3 : 1
});

export const AvatarListingList = props => (
  <List {...props} filters={<AvatarListingFilter />} bulkActionButtons={false}>
    <Datagrid rowStyle={rowStyle}>
      <OwnedFileImage
        source="thumbnail_owned_file_id"
        aspect="tall"
        defaultImage="https://asset-bundles-prod.reticulum.io/bots/avatar_unavailable.png"
      />
      <TextField source="name" />
      <AvatarLink source="avatar_sid" />
      <ConditionalReferenceField reference="avatar_listings" source="parent_avatar_listing_id">
        <TextField source="name" />
      </ConditionalReferenceField>
      <OwnedFileImage source="base_map_owned_file_id" aspect="square" />
      <OwnedFileImage source="emissive_map_owned_file_id" aspect="square" />
      <OwnedFileImage source="normal_map_owned_file_id" aspect="square" />
      <OwnedFileImage source="orm_map_owned_file_id" aspect="square" />
      <BooleanField source="allow_remixing" />
      <TextField source="reviewed_at" />
      <DateField source="inserted_at" />
      <DateField source="updated_at" />
      <TextField source="state" />
      <FeatureAvatarListingButton />
      <EditButton />
    </Datagrid>
  </List>
);
