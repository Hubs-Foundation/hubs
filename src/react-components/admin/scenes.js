import React from "react";
import { SceneLink, OwnedFileImage } from "./fields";

import {
  List,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  ReferenceInput,
  SelectInput,
  BooleanInput,
  DateInput,
  Datagrid,
  TextField,
  ReferenceField,
  DateField,
  BooleanField
} from "react-admin";

export const SceneCreate = props => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="id" />
      <TextInput source="scene_sid" />
      <TextInput source="slug" />
      <TextInput source="name" />
      <TextInput source="description" />
      <ReferenceInput source="account_id" reference="accounts">
        <SelectInput optionText="id" />
      </ReferenceInput>
      <ReferenceInput source="model_owned_file_id" reference="owned_files">
        <SelectInput optionText="id" />
      </ReferenceInput>
      <ReferenceInput source="screenshot_owned_file_id" reference="owned_files">
        <SelectInput optionText="id" />
      </ReferenceInput>
      <TextInput source="state" />
      <DateInput source="inserted_at" />
      <DateInput source="updated_at" />
      <BooleanInput source="allow_remixing" />
      <BooleanInput source="allow_promotion" />
      <ReferenceInput source="scene_owned_file_id" reference="owned_files">
        <SelectInput optionText="id" />
      </ReferenceInput>
      <TextInput source="reviewed_at" />
    </SimpleForm>
  </Create>
);

export const SceneEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="id" />
      <TextInput source="scene_sid" />
      <TextInput source="slug" />
      <TextInput source="name" />
      <TextInput source="description" />
      <ReferenceInput source="account_id" reference="accounts">
        <SelectInput optionText="id" />
      </ReferenceInput>
      <ReferenceInput source="model_owned_file_id" reference="owned_files">
        <SelectInput optionText="id" />
      </ReferenceInput>
      <ReferenceInput source="screenshot_owned_file_id" reference="owned_files">
        <SelectInput optionText="id" />
      </ReferenceInput>
      <TextInput source="state" />
      <DateInput source="inserted_at" />
      <DateInput source="updated_at" />
      <BooleanInput source="allow_remixing" />
      <BooleanInput source="allow_promotion" />
      <ReferenceInput source="scene_owned_file_id" reference="owned_files">
        <SelectInput optionText="id" />
      </ReferenceInput>
      <TextInput source="reviewed_at" />
    </SimpleForm>
  </Edit>
);

export const SceneList = props => (
  <List {...props}>
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
    </Datagrid>
  </List>
);
