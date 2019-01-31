import React from "react";
import { List, Datagrid, TextField, ReferenceField, DateField, BooleanField } from "react-admin";

const FooField = ({ source, record = {} }) => {
  console.log(record);
  return <span>{record[source]}</span>;
};

export const SceneList = props => (
  <List {...props}>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <ReferenceField source="account_id" reference="accounts">
        <TextField source="id" />
      </ReferenceField>
      <TextField source="scene_sid" />
      <TextField source="slug" />
      <TextField source="name" />
      <TextField source="description" />
      <TextField source="state" />
      <DateField source="inserted_at" />
      <DateField source="updated_at" />
      <TextField source="attribution" />
      <BooleanField source="allow_remixing" />
      <BooleanField source="allow_promotion" />
      <TextField source="attributions.content" />
      <TextField source="reviewed_at" />
    </Datagrid>
  </List>
);
