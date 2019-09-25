import React from "react";
import { SceneLink, OwnedFileImage, OwnedFileSizeField, ConditionalReferenceField } from "./fields";
import { ApproveSceneButton } from "./approve-buttons";
import { DenySceneButton } from "./deny-buttons";

import { List, Datagrid, TextField, DateField } from "react-admin";

export const PendingSceneList = props => (
  <List {...props}>
    <Datagrid>
      <OwnedFileImage source="screenshot_owned_file_id" />
      <OwnedFileSizeField label="Model size" source="model_owned_file_id" />
      <SceneLink source="scene_sid" />
      <TextField source="name" />
      <TextField source="attributions" />
      <ConditionalReferenceField source="scene_listing_id" reference="scene_listings">
        <TextField source="name" />
      </ConditionalReferenceField>
      <DateField source="updated_at" />
      <ApproveSceneButton />
      <DenySceneButton />
    </Datagrid>
  </List>
);
