import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CircularProgress from "@material-ui/core/CircularProgress";
import CardContent from "@material-ui/core/CardContent";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import Icon from "@material-ui/core/Icon";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import { green, amber } from "@material-ui/core/colors";
import { Title } from "react-admin";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { fetchReticulumAuthenticated } from "hubs/src/utils/phoenix-utils";
import clsx from "classnames";

const RESULTS = {
  ok: "ok",
  failed: "failed"
};

const styles = () => ({
  container: {
    display: "flex",
    flexWrap: "wrap",
    padding: "24px"
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
    lastImportedAsset: null
  };

  async onSubmit(e) {
    if (e) e.preventDefault();

    try {
      const parsedUrl = new URL(this.state.url);
      const pathParts = parsedUrl.pathname.split("/");
      const isScene = pathParts[1] === "scenes";
      const type = isScene ? "scenes" : "avatars";
      const url = `${parsedUrl.origin}/api/v1/${type}/${pathParts[2]}`;
      this.setState({ importing: true });

      const res = await fetchReticulumAuthenticated(`/api/v1/${type}`, "POST", { url });
      this.setState({
        importResult: RESULTS.ok,
        lastImportedUrl: this.state.url,
        lastImportedAsset: res[type][0],
        url: ""
      });
    } catch (e) {
      this.setState({ importResult: RESULTS.failed });
      console.error(e);
    }

    this.setState({ importing: false });
  }

  render() {
    let importMessage;

    if (!this.state.importing) {
      if (this.state.importResult === RESULTS.ok) {
        const url = this.state.lastImportedUrl;
        const isScene = new URL(url).pathname.split("/")[1] === "scenes";
        const type = isScene ? "scenes" : "avatars";
        const name = this.state.lastImportedAsset.name;
        importMessage = (
          <span className={clsx([this.props.classes.snackContents])}>
            Imported{" "}
            <a href={url} target="_blank" rel="noopener noreferrer">
              {name}
            </a>
            . Go to <a href={`/admin?#/pending_${type}`}>pending {type}</a> to manage.
          </span>
        );
      } else if (this.state.importResult === RESULTS.failed) {
        importMessage = "Unable to import content.";
      }
    }
    console.log(importMessage);

    return (
      <Card>
        <Title title="Import Content" />
        <CardContent>
          <p>
            Enter the URL to an avatar or scene on another Hubs site (such as hubs.mozilla.com) and it will be imported.
          </p>
        </CardContent>
        <form className={this.props.classes.container} onSubmit={e => this.onSubmit(e)}>
          <TextField
            key="url"
            id="url"
            label="URL to import"
            value={this.state.url}
            onChange={ev => this.setState({ url: ev.target.value })}
            type="text"
            fullWidth
            disabled={this.state.importing}
            margin="normal"
          />
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
                [this.props.classes.success]: this.state.importResult === RESULTS.ok,
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
