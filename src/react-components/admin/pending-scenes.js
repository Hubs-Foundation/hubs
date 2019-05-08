import React from "react";
import { SceneLink, OwnedFileImage, ConditionalReferenceField } from "./fields";
import { ApproveSceneButton } from "./approve-scene-button";
import { DenySceneButton } from "./deny-scene-button";

import { List, Datagrid, TextField, DateField } from "react-admin";

export const PendingSceneList = props => (
  <List {...props}>
    <Datagrid>
      <OwnedFileImage source="screenshot_owned_file_id" />
      <SceneLink source="scene_sid" />
      <TextField source="name" />
      <TextField source="description" />
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
