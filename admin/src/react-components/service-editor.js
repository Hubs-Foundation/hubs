import React, { Component } from 'react';
import { withStyles, createStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import LinearProgress from '@material-ui/core/LinearProgress';
import { Title } from 'react-admin';
import { getConfig, getConfigValue, setConfigValue, getServiceDisplayName, getSchemas, isDescriptor, putConfig } from "../utils/ita";

const styles = theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  button: {
    margin: "10px 10px 0 0",
  },
});

const schemas = getSchemas();

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
    config: null
  }

  componentDidMount() {
    schemas.then(schemas => this.setState({ schema: schemas[this.props.service] }));
    getConfig(this.props.service).then(config => this.setState({ config: config }));
  }

  onChange(path, ev) {
    const val = ev.target.value;
    const config = this.state.config;
    setConfigValue(config, path, val);
    this.setState({ config: config });
  }

  onSubmit(ev) {
    putConfig(this.props.service, this.state.config);
  }

  onRevert(ev) {
    getConfig(this.props.service).then(config => this.setState({ config: config }));
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
    case "string":
    case "number":
    default:
      return this.renderSimpleInput(path, descriptor, currentValue);
    }
  }

  renderTree(schema, config, prefix = "") {

    const configurables = getDescriptors(schema).map(([path, descriptor]) => {
      return this.renderConfigurable(path, descriptor, getConfigValue(config, path));
    });

    return (
      <form className={this.props.classes.container}>
        {configurables}
        <div>
          <Button onClick={this.onSubmit.bind(this)} className={this.props.classes.button} variant="contained" color="primary">Save</Button>
          <Button onClick={this.onRevert.bind(this)} className={this.props.classes.button} variant="contained" color="primary">Revert</Button>
        </div>
      </form>
    );
  }

  render() {
    const { service } = this.props;
    const { config, schema } = this.state;
    return (
      <Card>
        <Title title={getServiceDisplayName(service)} />
        <CardContent>
          {schema && config ? this.renderTree(schema, config) : <LinearProgress />}
        </CardContent>
      </Card>
    );
  }
}

export const ServiceEditor = withStyles(styles)(ConfigurationEditor);
