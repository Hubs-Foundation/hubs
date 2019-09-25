import React from "react";
import { SceneLink, OwnedFileImage } from "./fields";
import { FeatureSceneListingButton } from "./feature-listing-buttons";

import {
  List,
  Edit,
  SimpleForm,
  TextInput,
  EditButton,
  SelectInput,
  Datagrid,
  TextField,
  ReferenceField,
  DateField,
  BooleanField,
  Filter
} from "react-admin";

const SceneListingFilter = props => (
  <Filter {...props}>
    <TextInput label="Search Name" source="name" alwaysOn />
    <TextInput label="Search SID" source="scene_listing_sid" alwaysOn />
  </Filter>
);

export const SceneListingEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <TextInput source="description" />
      <SelectInput source="state" choices={[{ id: "active", name: "active" }, { id: "delisted", name: "delisted" }]} />
    </SimpleForm>
  </Edit>
);

export const SceneListingList = props => (
  <List {...props} filters={<SceneListingFilter />}>
    <Datagrid>
      <OwnedFileImage source="screenshot_owned_file_id" />
      <TextField source="name" />
      <TextField source="description" />
      <SceneLink source="scene_listing_sid" />
      <ReferenceField label="Scene" source="scene_id" reference="scenes">
        <TextField source="name" />
      </ReferenceField>
      <ReferenceField label="Allow remixing" source="scene_id" reference="scenes" linkType={false}>
        <BooleanField source="allow_remixing" />
      </ReferenceField>
      <ReferenceField label="Allow promotion" source="scene_id" reference="scenes" linkType={false}>
        <BooleanField source="allow_promotion" />
      </ReferenceField>
      <TextField source="reviewed_at" />
      <DateField source="inserted_at" />
      <DateField source="updated_at" />
      <TextField source="state" />
      <FeatureSceneListingButton />
      <EditButton />
    </Datagrid>
  </List>
);
