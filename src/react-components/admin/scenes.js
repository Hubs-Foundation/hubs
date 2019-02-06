import React from "react";
import { SceneLink, OwnedFileImage } from "./fields";

import {
  List,
  Edit,
  SimpleForm,
  TextInput,
  EditButton,
  BooleanInput,
  Datagrid,
  TextField,
  ReferenceField,
  DateField,
  BooleanField,
  Filter
} from "react-admin";

const SceneFilter = props => (
  <Filter {...props}>
    <TextInput label="Search Name" source="name" alwaysOn />
    <TextInput label="Search SID" source="scene_sid" alwaysOn />
  </Filter>
);

export const SceneEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <TextInput source="description" />
      <TextInput source="state" />
      <BooleanInput source="allow_remixing" />
      <BooleanInput source="allow_promotion" />
    </SimpleForm>
  </Edit>
);

export const SceneList = props => (
  <List {...props} filters={<SceneFilter />}>
    <Datagrid>
      <ReferenceField source="screenshot_owned_file_id" reference="owned_files" linkType={false}>
        <OwnedFileImage source="owned_file_uuid" />
      </ReferenceField>
      <TextField source="name" />
      <SceneLink source="scene_sid" />
      <BooleanField source="allow_remixing" />
      <BooleanField source="allow_promotion" />
      <TextField source="reviewed_at" />
      <DateField source="inserted_at" />
      <DateField source="updated_at" />
      <TextField source="state" />
      <EditButton />
    </Datagrid>
  </List>
);
