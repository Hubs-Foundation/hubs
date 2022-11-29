/* eslint-disable @calm/react-intl/missing-formatted-message*/
import React from "react";
import {
  List,
  Show,
  SimpleShowLayout,
  TextInput,
  Datagrid,
  TextField,
  DateField,
  Filter,
  ShowButton
} from "react-admin";
import { OwnedFileDownloadField } from "./fields";

const ProjectFilter = props => (
  <Filter {...props}>
    <TextInput label="Search SID" source="project_sid" alwaysOn />
  </Filter>
);

export const ProjectList = props => (
  <List {...props} filters={<ProjectFilter />}>
    <Datagrid>
      <TextField source="project_sid" />
      <ShowButton />
    </Datagrid>
  </List>
);

export const ProjectShow = props => (
  <Show {...props}>
    <SimpleShowLayout>
      <TextField source="project_sid" />
      <TextField source="name" />
      <OwnedFileDownloadField source="project_owned_file_id" getFileName={({ record }) => record.name + ".spoke"} />
      <DateField source="updated_at" />
      <DateField source="created_at" />
    </SimpleShowLayout>
  </Show>
);
