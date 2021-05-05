import React from "react";
import { CreateTokenModal, SelectScopesAndCreate, Error, ShowCredentialsOnce } from "./CreateTokenModal";

export default {
  title: "Tokens/CreateTokensModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const SelectScopes = () => {
  return (
    <CreateTokenModal>
      <SelectScopesAndCreate scopes={["read_rooms", "write_rooms"]} selectedScopes={["write_rooms"]} />
    </CreateTokenModal>
  );
};

export const SelectScopesNoScopesSelected = () => {
  return (
    <CreateTokenModal>
      <SelectScopesAndCreate
        scopes={["read_rooms", "write_rooms"]}
        selectedScopes={["write_rooms"]}
        showNoScopesError
      />
    </CreateTokenModal>
  );
};

export const ShowCredentials = () => {
  return (
    <CreateTokenModal>
      <ShowCredentialsOnce token="abcdefghi" />
    </CreateTokenModal>
  );
};

export const ShowError = () => {
  return (
    <CreateTokenModal>
      <Error errorMsg="I am an error!" />
    </CreateTokenModal>
  );
};
