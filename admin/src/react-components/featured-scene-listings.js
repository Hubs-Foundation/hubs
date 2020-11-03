import React from "react";
import { SceneLink, OwnedFileImage, OwnedFileSizeField } from "./fields";
import { FeatureSceneListingButton } from "./feature-listing-buttons";
import { ToolbarWithoutDelete } from "./toolbar-without-delete";

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
      <OwnedFileImage source="screenshot_owned_file_id" />
      <OwnedFileSizeField label="Model size" source="model_owned_file_id" />
      <TextField source="order" />
      <SceneLink source="scene_listing_sid" />
      <ReferenceField label="Listing" source="id" reference="scene_listings">
        <TextField source="name" />
      </ReferenceField>
      <TextField source="attributions" />
      <EditButton />
      <FeatureSceneListingButton />
    </Datagrid>
  </List>
);

export const FeaturedSceneListingEdit = props => (
  <Edit {...props}>
    <SimpleForm toolbar={<ToolbarWithoutDelete />}>
      <TextInput source="name" />
      <NumberInput source="order" />
    </SimpleForm>
  </Edit>
);
