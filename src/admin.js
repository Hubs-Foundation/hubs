import "./utils/debug-log";
import "./assets/stylesheets/admin.scss";

import "./utils/logging";

import ReactDOM from "react-dom";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connectToReticulum } from "./utils/phoenix-utils";
import { App } from "./App";
import { Admin, Resource, ListGuesser } from "react-admin";
//import { EditGuesser, CreateGuesser } from "react-admin";
import { postgrestClient, postgrestAuthenticatior } from "./utils/postgrest-data-provider";
import { SceneList, SceneEdit } from "./react-components/admin/scenes";
import { SceneListingList, SceneListingEdit } from "./react-components/admin/scene-listings";
import { AvatarList, AvatarEdit } from "./react-components/admin/avatars";
import { AvatarListingList, AvatarListingEdit } from "./react-components/admin/avatar-listings";
import { FeaturedSceneListingList, FeaturedSceneListingEdit } from "./react-components/admin/featured-scene-listings";
import { PendingSceneList } from "./react-components/admin/pending-scenes";
import { AccountList, AccountEdit } from "./react-components/admin/accounts";
import { ProjectList, ProjectShow } from "./react-components/admin/projects";

window.APP = new App();
const store = window.APP.store;

import registerTelemetry from "./telemetry";
registerTelemetry("/admin", "Hubs Admin");

class AdminUI extends Component {
  static propTypes = {
    dataProvider: PropTypes.func,
    authProvider: PropTypes.func
  };

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Admin
        dataProvider={this.props.dataProvider}
        authProvider={this.props.authProvider}
        loginPage={false}
        logoutButton={() => <span />}
      >
        <Resource name="pending_scenes" list={PendingSceneList} />
        <Resource name="scene_listings" list={SceneListingList} edit={SceneListingEdit} />
        <Resource name="featured_scene_listings" list={FeaturedSceneListingList} edit={FeaturedSceneListingEdit} />

        <Resource name="pending_avatars" list={AvatarList} />
        <Resource name="avatar_listings" list={AvatarListingList} edit={AvatarListingEdit} />
        <Resource name="featured_avatar_listings" list={AvatarListingList} edit={AvatarListingEdit} />

        <Resource name="accounts" list={AccountList} edit={AccountEdit} />
        <Resource name="scenes" list={SceneList} edit={SceneEdit} />
        <Resource name="avatars" list={AvatarList} edit={AvatarEdit} />
        <Resource name="owned_files" />

        <Resource name="projects" list={ProjectList} show={ProjectShow} />

        <Resource name="hubs_metrics" list={ListGuesser} />
      </Admin>
    );
  }
}

import { IntlProvider } from "react-intl";
import { lang, messages } from "./utils/i18n";

const mountUI = async retPhxChannel => {
  let dataProvider;
  let authProvider;

  // If POSTGREST_SERVER is set, we're talking directly to PostgREST over a tunnel, and will be managing the
  // perms token ourselves. If we're not, we talk to reticulum and presume it will handle perms token forwarding.
  if (process.env.POSTGREST_SERVER) {
    dataProvider = postgrestClient("//" + process.env.POSTGREST_SERVER);
    authProvider = postgrestAuthenticatior.createAuthProvider(retPhxChannel);
    await postgrestAuthenticatior.refreshPermsToken();

    // Refresh perms regularly
    setInterval(() => postgrestAuthenticatior.refreshPermsToken(), 60000);
  } else {
    dataProvider = postgrestClient("//" + process.env.RETICULUM_SERVER + "/api/postgrest");
    authProvider = postgrestAuthenticatior.createAuthProvider();
    postgrestAuthenticatior.setAuthToken(store.state.credentials.token);
  }

  ReactDOM.render(
    <IntlProvider locale={lang} messages={messages}>
      <AdminUI dataProvider={dataProvider} authProvider={authProvider} />
    </IntlProvider>,
    document.getElementById("ui-root")
  );
};

document.addEventListener("DOMContentLoaded", async () => {
  const socket = await connectToReticulum();

  // Reticulum global channel
  const retPhxChannel = socket.channel(`ret`, { hub_id: "admin", token: store.state.credentials.token });
  retPhxChannel
    .join()
    .receive("ok", async () => {
      mountUI(retPhxChannel);
    })
    .receive("error", res => {
      document.location = "/?sign_in&sign_in_destination=admin";
      console.error(res);
    });
});
