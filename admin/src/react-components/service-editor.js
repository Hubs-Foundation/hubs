/* eslint-disable react/prop-types */
/* eslint-disable @calm/react-intl/missing-formatted-message*/

import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import RefreshIcon from "@material-ui/icons/Refresh";
import ExpandIcon from "./shared/icons/ExpandIcon";
import PictureIcon from "./shared/icons/PictureIcon";
import Card from "@material-ui/core/Card";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import CardContent from "@material-ui/core/CardContent";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import TextField from "@material-ui/core/TextField";
import Switch from "@material-ui/core/Switch";
import Typography from "@material-ui/core/Typography";
import Icon from "@material-ui/core/Icon";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Button from "@material-ui/core/Button";
import LinearProgress from "@material-ui/core/LinearProgress";
import clsx from "classnames";
import { Title } from "react-admin";
import theme from "../utils/sample-theme";
import { store } from "hubs/src/utils/store-instance";
import withCommonStyles from "../utils/with-common-styles";
import {
  getEditableConfig,
  getConfigValue,
  setConfigValue,
  getCategoryDisplayName,
  getCategoryDescription,
  isDescriptor,
  putConfig,
  schemaCategories,
  getAdminInfo
} from "../utils/ita";
import * as AppConfigUtils from "../utils/app-config";

const qs = new URLSearchParams(location.hash.split("?")[1]);

const styles = withCommonStyles(theme => {
  const swatch = {
    borderRadius: "22px",
    border: "solid 1px #000000",
    width: "40px",
    height: "40px"
  };

  return {
    inputDescription: {
      display: "block",
      color: theme.palette.text.secondary,
      fontSize: "0.75rem",
      marginTop: "0.5em",
      borderTop: "1px solid rgba(0, 0, 0, 0.42)"
    },
    fileInput: {
      marginTop: "2em",
      marginBottom: "1em",
      "& .name": {
        color: theme.palette.text.secondary,
        display: "block",
        marginBottom: "0.5em",
        "&.filled": {
          fontSize: "0.75rem"
        }
      },
      "& .image": {
        width: "50px",
        maxHeight: "50px",
        marginRight: "1em",
        verticalAlign: "middle"
      }
    },
    switchInput: {
      margin: "2em 0",
      "& label": {
        marginLeft: "-1em",
        fontSize: "1rem"
      },
      "& .switch": {
        marginTop: "-0.1em"
      }
    },
    longInput: {
      "& textarea": {
        backgroundColor: "#E9E9E9"
      }
    },
    colorInput: {
      margin: "2em 0",
      "& label": {
        fontSize: "1rem"
      },
      "& input": {
        margin: 0,
        marginRight: "1em",
        marginBottom: "10px",
        padding: "4px",
        backgroundColor: "transparent",
        border: "0px solid hsl(0, 0%, 90%)",
        borderRadius: "3px",
        verticalAlign: "middle",
        height: "40px",
        width: "40px",
        "&::-webkit-color-swatch": swatch,
        "&::-moz-color-swatch": swatch
      }
    }
  };
});

function TabContainer(props) {
  return (
    <Typography component="div" style={{ padding: 8 * 3 }}>
      {props.children}
    </Typography>
  );
}

function getDescriptors(schema) {
  const descriptors = [];
  const traverse = (obj, prefix = []) => {
    for (const [k, v] of Object.entries(obj)) {
      const path = prefix.concat([k]);
      if (isDescriptor(v)) {
        descriptors.push([path, v]);
      } else {
        traverse(v, path);
      }
    }
  };
  traverse(schema);
  return descriptors;
}

function isEmptyObject(obj) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}

class ConfigurationEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      schema: null,
      config: null,
      category: this.firstAvailableCategory(),
      saving: false,
      saved: false,
      saveError: null,
      warningMessage: null,
      isDirty: false
    };
  }

  firstAvailableCategory() {
    for (const category of schemaCategories) {
      if (!this.props.schema[category] || isEmptyObject(this.props.schema[category])) continue;
      return category;
    }
  }

  async fetchConfigsForCategory() {
    const servicesForCategory = Object.keys(this.props.schema[this.state.category]);

    const config = {};

    for (const service of servicesForCategory) {
      config[service] = await this.getConfig(service);
    }

    this.setState({ config });
  }

  async getConfig() {
    throw new Error("Not implemented");
  }

  async putConfig() {
    throw new Error("Not implemented");
  }

  async componentDidMount() {
    this.fetchConfigsForCategory();
    const adminInfo = await getAdminInfo();
    this.setState({ provider: adminInfo.provider });
  }

  handleTabChange(event, category) {
    this.setState({ category, config: null }, () => this.fetchConfigsForCategory());
  }

  onChange(path, val) {
    const config = this.state.config;
    setConfigValue(config, path, val);
    this.setState({ config: config });
    this.setState({ isDirty: true });
  }

  onSubmit(e) {
    e.preventDefault();

    this.setState({ saving: true }, async () => {
      try {
        for (const [service, config] of Object.entries(this.state.config)) {
          if (Object.keys(config).length > 0) {
            const res = await this.putConfig(service, config);

            if (res.error) {
              this.setState({ saveError: `Error saving: ${res.error}` });
              break;
            }
          }
        }
      } catch (e) {
        this.setState({ saveError: e.toString() });
      }

      this.setState({ saving: false, saved: true });
    });
  }

  renderSimpleInput(path, descriptor, currentValue) {
    const displayPath = path.join(" > ");
    const inputType = descriptor.type === "number" ? "number" : "text";
    return (
      <TextField
        key={displayPath}
        id={displayPath}
        label={descriptor.name || displayPath}
        inputProps={{ maxLength: 4096 }}
        value={currentValue || ""}
        onChange={ev => this.onChange(path, ev.target.value)}
        helperText={descriptor.description}
        type={inputType}
        fullWidth
        margin="normal"
      />
    );
  }

  renderLongTextInput(path, { type, name, description }, currentValue) {
    const displayPath = path.join(" > ");
    const isTheme = name === "Themes";
    const isJson = type === "json";

    function isValidJSON(s) {
      try {
        JSON.parse(s);
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    }

    return (
      <div className={this.props.classes.longInput} key={displayPath}>
        <TextField
          multiline
          rows={20}
          key={displayPath}
          id={displayPath}
          label={name || displayPath}
          value={currentValue || (isTheme && !this.state.isDirty && JSON.stringify(theme, null, 2)) || ""}
          onChange={ev => {
            const value = ev.target.value;
            if (isJson) {
              if (!isValidJSON(value)) {
                const warningMessage = `Invalid JSON for ${name || displayPath}. See console for details.`;
                if (this.state.warningMessage !== warningMessage) {
                  this.setState({ warningMessage });
                }
                console.error(`Invalid JSON for ${name || displayPath}.`);
                console.error(value);
              } else {
                if (this.state.warningMessage !== null) {
                  this.setState({ warningMessage: null });
                }
              }
            }
            this.onChange(path, value);
          }}
          onBlur={ev => {
            const value = ev.target.value;
            if (isJson && isValidJSON(value)) {
              // Pretty print json strings
              const pretty = JSON.stringify(JSON.parse(value), null, 2);
              this.onChange(path, pretty);
            }
          }}
          helperText={description}
          type="text"
          fullWidth
          margin="normal"
        />

        {isTheme && (
          <div className="flex-end">
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                this.onChange(path, JSON.stringify(theme, null, 2));
                const warningMessage = `Make sure to save your updates`;
                if (this.state.warningMessage !== warningMessage) {
                  this.setState({ warningMessage });
                }
              }}
            >
              <RefreshIcon />
              Revert to original theme data
            </Button>
          </div>
        )}
      </div>
    );
  }

  renderFileInput(path, descriptor, currentValue) {
    let imageURL;
    if (!currentValue) {
      imageURL = null;
    } else if (currentValue instanceof File) {
      imageURL = URL.createObjectURL(currentValue);
    } else if (currentValue.origin) {
      imageURL = currentValue.origin;
    } else {
      imageURL = currentValue;
    }

    const displayPath = path.join(" > ");

    return (
      <div key={displayPath} className={this.props.classes.fileInput}>
        <div className={clsx("name", { filled: !!imageURL })}>{descriptor.name || displayPath}</div>
        <label>
          {imageURL && <img className="image" src={imageURL} />}
          <input type="file" onChange={ev => this.onChange(path, ev.target.files[0])} style={{ display: "none" }} />
          <Button variant="outlined" color="secondary" size="small" onClick={e => e.target.parentNode.click()}>
            Upload
          </Button>
        </label>
        <span className={this.props.classes.inputDescription}>{descriptor.description}</span>
      </div>
    );
  }

  renderSwitchInput(path, descriptor, currentValue) {
    const displayPath = path.join(" > ");
    return (
      <div key={displayPath} className={this.props.classes.switchInput}>
        <label>
          <Switch className="switch" checked={currentValue} onChange={ev => this.onChange(path, ev.target.checked)} />
          {descriptor.name || displayPath}
        </label>
        <span className={this.props.classes.inputDescription}>{descriptor.description}</span>
      </div>
    );
  }

  renderColorInput(path, descriptor, currentValue) {
    const displayPath = path.join(" > ");
    return (
      <div key={displayPath} className={this.props.classes.colorInput}>
        <label>
          <input
            type="color"
            value={currentValue || ""}
            onChange={ev => this.onChange(path, ev.target.value)}
            title={currentValue}
          />
          {descriptor.name || displayPath}
        </label>
        <span className={this.props.classes.inputDescription}>{descriptor.description}</span>
      </div>
    );
  }

  renderConfigurable(path, descriptor, currentValue) {
    switch (descriptor.type) {
      case "list":
        return null;
      case "file":
        return this.renderFileInput(path, descriptor, currentValue);
      case "boolean":
        return this.renderSwitchInput(path, descriptor, currentValue);
      case "color":
        return this.renderColorInput(path, descriptor, currentValue);
      case "longstring":
      case "json":
        return this.renderLongTextInput(path, descriptor, currentValue);
      case "string":
      case "number":
      default:
        return this.renderSimpleInput(path, descriptor, currentValue);
    }
  }

  renderCategory(schema, category, config) {
    switch (category) {
      case "theme":
        return this.renderThemeSection(schema.theme, config);
      case "images":
        return this.renderImagesSection(schema.images, config);
      default:
        return this.renderTree(schema, category, config);
    }
  }

  getFilteredDescriptors(category) {
    return getDescriptors(category)
      .filter(([, descriptor]) => qs.get("show_internal_configs") !== null || descriptor.internal !== "true")
      .filter(([, descriptor]) => qs.get("show_deprecated_configs") !== null || descriptor.deprecated !== "true");
  }

  /**
   * Theme Tab Section
   */
  renderThemeSection(theme, config) {
    const configurables = this.getFilteredDescriptors(theme);
    const getInput = ([path, descriptor]) => this.renderConfigurable(path, descriptor, getConfigValue(config, path));

    return (
      <form onSubmit={this.onSubmit.bind(this)}>
        <h3 className="heading-sm mb-24">Nametags</h3>
        {getInput(configurables[0])}
        {getInput(configurables[1])}
        <h3 className="heading-sm mb-24 mt-40">Theme Data</h3>
        <p className="body-md">
          This section contains the code which generates the available themes a user can choose from when in your
          hub&#39;s rooms (More &gt; Preferences &gt; Misc &gt; Theme).More information about customizing your hubs&#39;
          themes can be found in our{" "}
          <a
            href="https://docs.hubsfoundation.org/hubs-cloud-customizing-themes.html"
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            documentation pages
          </a>{" "}
          .
        </p>
        {getInput(configurables[2])}
        <div>
          {this.state.saving ? (
            <CircularProgress />
          ) : (
            <Button
              onClick={this.onSubmit.bind(this)}
              className={this.props.classes.button}
              variant="contained"
              color="primary"
              disabled={this.state.warningMessage}
            >
              Save
            </Button>
          )}
        </div>
      </form>
    );
  }

  /**
   * Images AKA Brand Tab Section
   */
  renderImagesSection(images, config) {
    const configurables = this.getFilteredDescriptors(images);
    const getInput = ([path, descriptor]) => this.renderConfigurable(path, descriptor, getConfigValue(config, path));

    const AdditionalInfo = ({ size, format }) => {
      return (
        <div className="flex-align-items-center">
          <ExpandIcon />
          <span className="ml-10 mr-20">{size}</span>
          <PictureIcon />
          <span className="ml-10">{format}</span>
        </div>
      );
    };

    return (
      <form onSubmit={this.onSubmit.bind(this)}>
        <h3 className="heading-sm mb-24">Hub</h3>

        {/* HUB LOGO  */}
        {getInput(configurables[0])}
        <AdditionalInfo size="250px x 250px" format="JPG, GIF, PNG, SVG" />

        {/* HUB LOGO DARK MODE  */}
        {getInput(configurables[1])}
        <AdditionalInfo size="250px x 250px" format="JPG, GIF, PNG, SVG" />

        {/* FAVICON */}
        {getInput(configurables[2])}
        <AdditionalInfo size="96px x 96px" format="JPG, GIF, PNG" />

        <h3 className="heading-sm mb-24 mt-40">Hub Home Page</h3>

        {/* HOMEPAGE IMAGE  */}
        {getInput(configurables[3])}
        <AdditionalInfo size="1000px x 1000px" format="JPG, GIF, PNG, SVG" />

        {/* COMPANY LOGO  */}
        {getInput(configurables[4])}
        <AdditionalInfo size="250px x 250px" format="JPG, GIF, PNG, SVG" />

        <h3 className="heading-sm mb-24 mt-40">Sharing and Social Media</h3>

        {/* SHORTCUT ICON */}
        {getInput(configurables[5])}
        <AdditionalInfo size="512px x 512px" format="JPG, GIF, PNG" />

        {/* SOCIAL MEDIA CARD */}
        {getInput(configurables[6])}
        <AdditionalInfo size="1024px x 576px (max)" format="JPG, GIF, PNG" />
        <div>
          {this.state.saving ? (
            <CircularProgress />
          ) : (
            <Button
              onClick={this.onSubmit.bind(this)}
              className={this.props.classes.button}
              variant="contained"
              color="primary"
            >
              Save
            </Button>
          )}
        </div>
      </form>
    );
  }

  /**
   * General Render Tree
   */
  renderTree(schema, category, config) {
    const configurables = this.getFilteredDescriptors(schema[category]).map(([path, descriptor]) =>
      this.renderConfigurable(path, descriptor, getConfigValue(config, path))
    );

    return (
      <form onSubmit={this.onSubmit.bind(this)}>
        {configurables}
        <div>
          {this.state.saving ? (
            <CircularProgress />
          ) : (
            <Button
              onClick={this.onSubmit.bind(this)}
              className={this.props.classes.button}
              variant="contained"
              color="primary"
            >
              Save
            </Button>
          )}
        </div>
      </form>
    );
  }

  render() {
    const { config, category } = this.state;
    const { schema } = this.props;

    return (
      <Card className={this.props.classes.container}>
        <Title title="Server Settings" />
        <CardContent className={this.props.classes.info}>
          <Tabs
            value={this.state.category}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            onChange={this.handleTabChange.bind(this)}
          >
            {schemaCategories
              .filter(c => this.props.schema[c] && !isEmptyObject(this.props.schema[c]))
              .map(c => (
                <Tab label={getCategoryDisplayName(c)} key={c} value={c} />
              ))}
          </Tabs>
          <TabContainer>
            <Typography variant="body2" gutterBottom>
              {getCategoryDescription(this.state.category, this.state.provider)}
            </Typography>

            {schema && config ? this.renderCategory(schema, category, config) : <LinearProgress />}
          </TabContainer>
        </CardContent>
        <Snackbar
          anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
          open={this.state.saved || !!this.state.saveError || !!this.state.warningMessage}
          autoHideDuration={10000}
          onClose={() => {
            this.setState({ saved: false, saveError: null, warningMessage: null });
          }}
        >
          <SnackbarContent
            className={clsx({
              [this.props.classes.success]: !this.state.saveError && !this.state.warningMessage,
              [this.props.classes.warning]: !!this.state.saveError || !!this.state.warningMessage
            })}
            message={
              <span id="import-snackbar" className={this.props.classes.message}>
                <Icon className={clsx(this.props.classes.icon, this.props.classes.iconVariant)} />
                {this.state.saveError || this.state.warningMessage || (this.state.saved && "Settings saved.") || ""}
              </span>
            }
            action={[
              <IconButton
                key="close"
                color="inherit"
                onClick={() => this.setState({ saved: false, warningMessage: null })}
              >
                <CloseIcon className={this.props.classes.icon} />
              </IconButton>
            ]}
          ></SnackbarContent>
        </Snackbar>
      </Card>
    );
  }
}

const ServiceEditor = withStyles(styles)(
  class ServiceEditor extends ConfigurationEditor {
    getConfig(service) {
      return getEditableConfig(service);
    }
    putConfig(service, config) {
      return putConfig(service, config);
    }
  }
);

const AppConfigEditor = withStyles(styles)(
  class AppConfigEditor extends ConfigurationEditor {
    constructor(props) {
      super(props);
      if (store.state && store.state.credentials && store.state.credentials.token) {
        AppConfigUtils.setAuthToken(store.state.credentials.token);
      }
    }
    getConfig() {
      return AppConfigUtils.getConfig();
    }
    putConfig(service, config) {
      return AppConfigUtils.putConfig(config);
    }
  }
);

export { ServiceEditor, AppConfigEditor };
