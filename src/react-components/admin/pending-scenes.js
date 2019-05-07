import React from "react";
import { SceneLink, OwnedFileImage } from "./fields";
import { ApproveSceneButton } from "./approve-scene-button";
import DenySceneButton from "./deny-scene-button";

import { List, Datagrid, TextField, ReferenceField, DateField } from "react-admin";

export const PendingSceneList = props => (
  <List {...props}>
    <Datagrid>
      <OwnedFileImage source="screenshot_owned_file_id" />
      <SceneLink source="scene_sid" />
      <TextField source="name" />
      <TextField source="description" />
      <TextField source="attributions" />
      <ReferenceField source="scene_listing_id" reference="scene_listings">
        <TextField source="name" />
      </ReferenceField>
      <DateField source="updated_at" />
      <ApproveSceneButton />
      <DenySceneButton />
    </Datagrid>
  </List>
);
