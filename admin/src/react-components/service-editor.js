import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import CardContent from "@material-ui/core/CardContent";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import LinearProgress from "@material-ui/core/LinearProgress";
import { Title } from "react-admin";
import withCommonStyles from "../utils/with-common-styles";
import {
  getConfig,
  getConfigValue,
  setConfigValue,
  getServiceDisplayName,
  getCategoryDisplayName,
  getCategoryDescription,
  isDescriptor,
  putConfig,
  schemaCategories
} from "../utils/ita";

const styles = withCommonStyles(() => ({}));

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

class ConfigurationEditor extends Component {
  state = {
    schema: null,
    config: null,
    category: schemaCategories[0]
  };

  componentDidMount() {
    //this.setState({ schema: this.props.schemas[this.props.category] });
    //getConfig(this.props.service).then(config => this.setState({ config: config }));
  }

  onChange(path, ev) {
    const val = ev.target.value;
    const config = this.state.config;
    setConfigValue(config, path, val);
    this.setState({ config: config });
  }

  onSubmit() {
    //putConfig(this.props.service, this.state.config);
  }

  onRevert() {
    //getConfig(this.props.service).then(config => this.setState({ config: config }));
  }

  renderSimpleInput(path, descriptor, currentValue) {
    const displayPath = path.join(" > ");
    const inputType = descriptor.type === "number" ? "number" : "text";
    return (
      <TextField
        key={displayPath}
        id={displayPath}
        label={displayPath}
        value={currentValue !== undefined ? currentValue : descriptor.default}
        onChange={ev => this.onChange(path, ev)}
        type={inputType}
        fullWidth
        margin="normal"
      />
    );
  }

  renderConfigurable(path, descriptor, currentValue) {
    switch (descriptor.type) {
      case "list":
        return null;
      case "boolean":
      case "string":
      case "number":
      default:
        return this.renderSimpleInput(path, descriptor, currentValue);
    }
  }

  renderTree(schema, config) {
    return [];
    /*const configurables = getDescriptors(schema).map(([path, descriptor]) => {
      return this.renderConfigurable(path, descriptor, getConfigValue(config, path));
    });

    return (
      <form className={this.props.classes.container}>
        {configurables}
        <div>
          <Button
            onClick={this.onSubmit.bind(this)}
            className={this.props.classes.button}
            variant="contained"
            color="primary"
          >
            Save
          </Button>
          <Button
            onClick={this.onRevert.bind(this)}
            className={this.props.classes.button}
            variant="contained"
            color="primary"
          >
            Revert
          </Button>
        </div>
      </form>
    );*/
  }

  render() {
    const { config, schema } = this.state;
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
            onChange={(e, category) => this.setState({ category })}
          >
            {schemaCategories.map(c => (
              <Tab label={getCategoryDisplayName(c)} key={c} value={c} />
            ))}
          </Tabs>
          <TabContainer>
            <Typography variant="subtitle1" gutterBottom>
              {getCategoryDescription(this.state.category)}
            </Typography>
            {schema && config ? this.renderTree(schema, config) : <LinearProgress />}
          </TabContainer>
        </CardContent>
      </Card>
    );
  }
}

export const ServiceEditor = withStyles(styles)(ConfigurationEditor);
