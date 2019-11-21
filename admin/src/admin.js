import configs from "./utils/configs";
import ReactDOM from "react-dom";
import React, { Component } from "react";
import { Route } from "react-router-dom";
import PropTypes from "prop-types";
import toml from "@iarna/toml";
import {
  schemaByCategories,
  schemaCategories,
  getSchemas as getItaSchemas,
  setAuthToken as setItaAuthToken
} from "./utils/ita";
import { connectToReticulum } from "hubs/src/utils/phoenix-utils";
import { Admin, Layout, Resource } from "react-admin";
//import { EditGuesser, CreateGuesser } from "react-admin";
import { postgrestClient, postgrestAuthenticatior } from "./utils/postgrest-data-provider";
import { AdminMenu } from "./react-components/admin-menu";
import { SceneList, SceneEdit } from "./react-components/scenes";
import { SceneListingList, SceneListingEdit } from "./react-components/scene-listings";
import { AvatarList, AvatarEdit } from "./react-components/avatars";
import { AvatarListingList, AvatarListingEdit } from "./react-components/avatar-listings";
import { FeaturedSceneListingList, FeaturedSceneListingEdit } from "./react-components/featured-scene-listings";
import { PendingSceneList } from "./react-components/pending-scenes";
import { AccountList, AccountEdit } from "./react-components/accounts";
import { ProjectList, ProjectShow } from "./react-components/projects";
import { SystemEditor } from "./react-components/system-editor";
import { ServiceEditor, AppConfigEditor } from "./react-components/service-editor";
import { ServerAccess } from "./react-components/server-access";
import { DataTransfer } from "./react-components/data-transfer";
import { ImportContent } from "./react-components/import-content";
import Store from "hubs/src/storage/store";
import registerTelemetry from "hubs/src/telemetry";
import { createMuiTheme } from "@material-ui/core/styles";

const store = new Store();
window.APP = { store };

registerTelemetry("/admin", "Hubs Admin");

let itaSchemas;

const theme = createMuiTheme({
  overrides: {
    MuiDrawer: {
      docked: {
        background: "#222222"
      }
    },
    MuiList: {
      root: {
        "& .active": {
          background: "#FF3464 !important"
        }
      },
      active: {
        color: "#ff0000"
      }
    },
    MuiListItemText: {
      root: {
        color: "#eeeeee"
      }
    },
    MuiListItemIcon: {
      root: {
        color: "#aaaaaa"
      }
    },
    MuiTypography: {
      subheading: {
        color: "auto" // Needed to override menu items
      }
    }
  },
  palette: {
    secondary: {
      main: "#000000"
    },
    action: {
      selected: "#ff0000"
    },
    text: {
      primary: "#ff0000",
      secondary: "#00ff00"
    }
  }
});
console.log(theme);

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
        dashboard={SystemEditor}
        appLayout={this.props.layout}
        customRoutes={this.props.customRoutes}
        dataProvider={this.props.dataProvider}
        authProvider={this.props.authProvider}
        loginPage={false}
        logoutButton={() => <span />}
        theme={theme}
      >
        <Resource name="pending_scenes" list={PendingSceneList} />
        <Resource
          name="scene_listings"
          list={SceneListingList}
          edit={SceneListingEdit}
          options={{ label: "Approved scenes" }}
        />
        <Resource
          name="featured_scene_listings"
          list={FeaturedSceneListingList}
          edit={FeaturedSceneListingEdit}
          options={{ label: "Featured scenes" }}
        />

        <Resource name="pending_avatars" list={AvatarList} />
        <Resource
          name="avatar_listings"
          list={AvatarListingList}
          edit={AvatarListingEdit}
          options={{ label: "Approved avatars" }}
        />
        <Resource
          name="featured_avatar_listings"
          list={AvatarListingList}
          edit={AvatarListingEdit}
          options={{ label: "Featured avatars" }}
        />

        <Resource name="accounts" list={AccountList} edit={AccountEdit} />
        <Resource name="scenes" list={SceneList} edit={SceneEdit} />
        <Resource name="avatars" list={AvatarList} edit={AvatarEdit} />
        <Resource name="owned_files" />

        <Resource name="projects" list={ProjectList} show={ProjectShow} />
      </Admin>
    );
  }
}

import { IntlProvider } from "react-intl";
import { lang, messages } from "./utils/i18n";

const mountUI = async (retPhxChannel, customRoutes, layout) => {
  let dataProvider;
  let authProvider;

  // If POSTGREST_SERVER is set, we're talking directly to PostgREST over a tunnel, and will be managing the
  // perms token ourselves. If we're not, we talk to reticulum and presume it will handle perms token forwarding.

  if (configs.POSTGREST_SERVER) {
    dataProvider = postgrestClient(configs.POSTGREST_SERVER);
    authProvider = postgrestAuthenticatior.createAuthProvider(retPhxChannel);
    await postgrestAuthenticatior.refreshPermsToken();

    // Refresh perms regularly
    setInterval(() => postgrestAuthenticatior.refreshPermsToken(), 60000);
  } else {
    const server = configs.RETICULUM_SERVER || document.location.host;
    dataProvider = postgrestClient("//" + server + "/api/postgrest");
    authProvider = postgrestAuthenticatior.createAuthProvider();
    postgrestAuthenticatior.setAuthToken(store.state.credentials.token);
  }

  window.APP.dataProvider = dataProvider;
  window.APP.authProvider = authProvider;

  ReactDOM.render(
    <IntlProvider locale={lang} messages={messages}>
      <AdminUI dataProvider={dataProvider} authProvider={authProvider} customRoutes={customRoutes} layout={layout} />
    </IntlProvider>,
    document.getElementById("ui-root")
  );
};

document.addEventListener("DOMContentLoaded", async () => {
  const socket = await connectToReticulum();

  if (store.state && store.state.credentials && store.state.credentials.token) {
    setItaAuthToken(store.state.credentials.token);
    try {
      //itaSchemas = schemaByCategories(await getItaSchemas());
    } catch (e) {
      // Let the admin console run but skip showing configs.
    }
  }

  const homeRoute = <Route exact path="/home" component={SystemEditor} />;
  const importRoute = <Route exact path="/import" component={ImportContent} />;
  const accessRoute = <Route exact path="/server-access" component={ServerAccess} />;
  const dtRoute = <Route exact path="/data-transfer" component={DataTransfer} />;

  const customRoutes = [homeRoute, importRoute, accessRoute, dtRoute];

  /*try {
    const appConfigSchema = schemaByCategories({
      hubs: toml.parse(await fetch("/hubs/schema.toml").then(r => r.text()))
    });
    const appConfigRoute = (
      <Route path="/app-settings" render={props => <AppConfigEditor {...props} schema={appConfigSchema} />} />
    );
    customRoutes.push(appConfigRoute);
  } catch (e) {
    console.error("Could not initialize app config.", e);
  }*/

  if (itaSchemas) {
    customRoutes.push(
      <Route path="/server-setup" render={props => <ServiceEditor {...props} schema={itaSchemas} />} />
    );
  }

  const layout = props => <Layout {...props} menu={props => <AdminMenu {...props} services={schemaCategories} />} />;

  const redirectToLogin = () => (document.location = "/?sign_in&sign_in_destination=admin");

  if (store.state.credentials && store.state.credentials.token) {
    // Reticulum global channel
    const retPhxChannel = socket.channel(`ret`, { hub_id: "admin", token: store.state.credentials.token });
    retPhxChannel
      .join()
      .receive("ok", async () => {
        mountUI(retPhxChannel, customRoutes, layout);
      })
      .receive("error", res => {
        document.location = "/?sign_in&sign_in_destination=admin";
        console.error(res);
      });
  } else {
    redirectToLogin();
  }
});
