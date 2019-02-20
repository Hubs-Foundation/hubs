import React from "react";
import { SceneLink, OwnedFileImage } from "./fields";
import UnfeatureSceneListingButton from "./unfeature-scene-listing-button";

import {
  List,
  Edit,
  EditButton,
  TextInput,
  SimpleForm,
  NumberInput,
  Datagrid,
  TextField,
  ReferenceField
} from "react-admin";

export const FeaturedSceneListingList = props => (
  <List {...props} sort={{ field: "order", order: "ASC" }}>
    <Datagrid>
      <ReferenceField source="screenshot_owned_file_id" reference="owned_files" linkType={false}>
        <OwnedFileImage source="owned_file_uuid" />
      </ReferenceField>
      <TextField source="order" />
      <SceneLink source="scene_listing_sid" />
      <ReferenceField label="Listing" source="id" reference="scene_listings">
        <TextField source="name" />
      </ReferenceField>
      <TextField source="description" />
      <TextField source="attributions" />
      <EditButton />
      <UnfeatureSceneListingButton />
    </Datagrid>
  </List>
);

export const FeaturedSceneListingEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <NumberInput source="order" />
    </SimpleForm>
  </Edit>
);
