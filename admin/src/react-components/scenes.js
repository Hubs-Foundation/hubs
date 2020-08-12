import React from "react";
import { SceneLink, OwnedFileImage, OwnedFileSizeField } from "./fields";
import { ApproveSceneButton } from "./approve-buttons";
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

const SceneFilter = props => (
  <Filter {...props}>
    <TextInput label="Search Name" source="name" alwaysOn />
    <TextInput label="Search SID" source="scene_sid" alwaysOn />
  </Filter>
);

export const SceneEdit = props => (
  <Edit {...props}>
    <SimpleForm toolbar={<ToolbarWithoutDelete />}>
      <TextInput source="name" />
      <SelectInput
        label="Status"
        source="state"
        choices={[{ id: "active", name: "active" }, { id: "removed", name: "removed" }]}
      />
      <BooleanInput source="allow_remixing" />
      <BooleanInput source="allow_promotion" />
    </SimpleForm>
  </Edit>
);

export const SceneList = props => (
  <List {...props} filters={<SceneFilter />}>
    <Datagrid>
      <OwnedFileImage source="screenshot_owned_file_id" />
      <OwnedFileSizeField label="Model size" source="model_owned_file_id" />
      <TextField source="name" />
      <SceneLink source="scene_sid" />
      <BooleanField source="allow_remixing" />
      <BooleanField source="allow_promotion" />
      <DateField source="updated_at" />
      <TextField label="Status" source="state" />
      <EditButton />
      <ApproveSceneButton />
    </Datagrid>
  </List>
);
