import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CircularProgress from "@material-ui/core/CircularProgress";
import CardContent from "@material-ui/core/CardContent";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Icon from "@material-ui/core/Icon";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import { green, amber } from "@material-ui/core/colors";
import { Title } from "react-admin";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { fetchReticulumAuthenticated } from "hubs/src/utils/phoenix-utils";
import clsx from "classnames";
import { GET_MANY_REFERENCE } from "react-admin";
import { sceneApproveNew, sceneReviewed } from "./scene-actions";
import { avatarApproveNew, avatarReviewed } from "./avatar-actions";

const RESULTS = {
  new_listing: "new_listing",
  existing_listing: "existing_listing",
  failed: "failed"
};

const styles = () => ({
  container: {
    display: "flex",
    flexWrap: "wrap",
    padding: "24px",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start"
  },
  button: {
    margin: "10px 10px 0 0"
  },
  success: {
    backgroundColor: green[600]
  },
  warning: {
    backgroundColor: amber[700]
  },
  icon: {
    fontSize: 20
  },
  message: {
    display: "flex",
    alignItems: "center"
  },
  snackContents: {
    "& a": {
      color: "white"
    }
  }
});

class ImportContentComponent extends Component {
  state = {
    url: "",
    importing: false,
    importResult: null,
    lastImportedUrl: null,
    lastImportedAsset: null,
    addBaseTag: false,
    addDefaultTag: false
  };

  handleUrlChanged(ev) {
    this.setState({ url: ev.target.value });
  }

  apiInfoForSubmittedUrl(url) {
    try {
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split("/");
      const isScene = pathParts[1] === "scenes";
      const type = isScene ? "scenes" : "avatars";
      return { url: `${parsedUrl.origin}/api/v1/${type}/${pathParts[2]}`, isScene };
    } catch (e) {
      return null;
    }
  }

  async onSubmit(e) {
    if (e) e.preventDefault();

    const apiInfo = this.apiInfoForSubmittedUrl(this.state.url);

    if (!apiInfo) {
      this.setState({ importResult: RESULTS.failed });
      console.error(e);
    }

    const { url, isScene } = apiInfo;
    const type = isScene ? "scenes" : "avatars";
    const columnPrefix = isScene ? "scene" : "avatar";
    this.setState({ importing: true });

    const res = await fetchReticulumAuthenticated(`/api/v1/${type}`, "POST", { url });
    const tags = [];

    if (this.state.addBaseTag) {
      tags.push("base");
    }

    if (this.state.addDefaultTag) {
      tags.push("default");
    }

    this.setState({
      lastImportedUrl: this.state.url,
      lastImportedAsset: res[type][0],
      url: ""
    });

    const dataProvider = window.APP.dataProvider;
    const approveNew = isScene ? sceneApproveNew : avatarApproveNew;
    const reviewed = isScene ? sceneReviewed : avatarReviewed;

    // Import API returns the sid, need to lonew_listing up the id and then check for a listing.
    const sid = res[type][0][`${columnPrefix}_id`];

    const objectRes = await dataProvider(GET_MANY_REFERENCE, type, {
      sort: { field: "id", order: "desc" },
      target: `${columnPrefix}_sid`,
      id: sid
    });
    const objId = objectRes.data[0].id;
    const listingRes = await dataProvider(GET_MANY_REFERENCE, `${columnPrefix}_listings`, {
      sort: { field: "id", order: "desc" },
      target: `_${columnPrefix}_id`,
      id: objId
    });

    // If there is an existing listing, object ends up in pending, otherwise create a listing.
    if (listingRes.data.length === 0) {
      const exec = async f => {
        const d = f();
        await dataProvider(d.meta.fetch, d.meta.resource, d.payload);
      };

      await exec(() => {
        const d = approveNew(objectRes.data[0]);

        // Add any tags due to form
        d.payload.data.tags.tags = tags;
        return d;
      });

      await exec(() => reviewed(objId));
      this.setState({ importResult: RESULTS.new_listing });
    } else {
      this.setState({ importResult: RESULTS.existing_listing });
    }

    this.setState({ importing: false });
  }

  render() {
    let importMessage;

    if (!this.state.importing && this.state.lastImportedUrl) {
      const url = this.state.lastImportedUrl;
      const isScene = new URL(url).pathname.split("/")[1] === "scenes";
      const type = isScene ? "scenes" : "avatars";
      const listingType = isScene ? "scene_listings" : "avatar_listings";
      const name = this.state.lastImportedAsset.name;

      if (this.state.importResult === RESULTS.existing_listing) {
        importMessage = (
          <span className={clsx([this.props.classes.snackContents])}>
            Updated{" "}
            <a href={url} target="_blank" rel="noopener noreferrer">
              {name}
            </a>
            . Go to <a href={`/admin?#/pending_${type}`}>pending {type}</a> to approve the changes.
          </span>
        );
      } else if (this.state.importResult === RESULTS.new_listing) {
        importMessage = (
          <span className={clsx([this.props.classes.snackContents])}>
            Imported{" "}
            <a href={url} target="_blank" rel="noopener noreferrer">
              {name}
            </a>
            . Go to <a href={`/admin?#/${listingType}`}>approved {type}</a> to manage.
          </span>
        );
      } else if (this.state.importResult === RESULTS.failed) {
        importMessage = "Unable to import content.";
      }
    }

    let isAvatar = false,
      isScene = false;
    try {
      isAvatar = new URL(this.state.url).pathname.split("/")[1] === "avatars";
      isScene = new URL(this.state.url).pathname.split("/")[1] === "scenes";
    } catch (e) {
      // Do nothing
    }

    return (
      <Card>
        <Title title="Import Content" />
        <CardContent>
          <p>
            Enter the URL to an avatar or scene on another Hubs site (such as hubs.mozilla.com) and it will be imported.
          </p>
        </CardContent>
        <form className={this.props.classes.container} onSubmit={e => this.onSubmit(e)}>
          <FormControl>
            <FormGroup>
              <TextField
                key="url"
                id="url"
                label="URL to import"
                value={this.state.url}
                onChange={this.handleUrlChanged.bind(this)}
                type="text"
                fullWidth
                disabled={this.state.importing}
                margin="normal"
              />
              {isAvatar && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={this.state.addBaseTag}
                      onChange={e => this.setState({ addBaseTag: e.target.checked })}
                      value="addBaseTag"
                    />
                  }
                  label="Import as a base avatar. Base avatars will be offered to users to re-skin when creating a custom avatar."
                />
              )}
              {(isScene || isAvatar) && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={this.state.addDefaultTag}
                      onChange={e => this.setState({ addDefaultTag: e.target.checked })}
                      value="addDefaultTag"
                    />
                  }
                  label={`${
                    isScene
                      ? "Import as a default scene. Default scenes will be used when creating new rooms."
                      : "Import as a default avatar. New users will be assigned default avatars."
                  }`}
                />
              )}
            </FormGroup>
          </FormControl>
          {this.state.importing ? (
            <CircularProgress />
          ) : (
            <Button
              onClick={this.onSubmit.bind(this)}
              className={this.props.classes.button}
              variant="contained"
              color="primary"
            >
              Import
            </Button>
          )}
          <Snackbar
            anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
            open={!!importMessage}
            autoHideDuration={10000}
            onClose={() => this.setState({ importResult: null, lastImportedUrl: null })}
          >
            <SnackbarContent
              className={clsx({
                [this.props.classes.success]:
                  this.state.importResult === RESULTS.new_listing ||
                  this.state.importResult === RESULTS.existing_listing,
                [this.props.classes.warning]: this.state.importResult === RESULTS.failed
              })}
              message={
                <span id="import-snackbar" className={this.props.classes.message}>
                  <Icon className={clsx(this.props.classes.icon, this.props.classes.iconVariant)} />
                  {importMessage}
                </span>
              }
              action={[
                <IconButton
                  key="close"
                  color="inherit"
                  onClick={() => this.setState({ importResult: null, lastImportedUrl: null })}
                >
                  <CloseIcon className={this.props.classes.icon} />
                </IconButton>
              ]}
            ></SnackbarContent>
          </Snackbar>
        </form>
      </Card>
    );
  }
}

export const ImportContent = withStyles(styles)(ImportContentComponent);
