import configs from "../utils/configs";
import PropTypes from "prop-types";

export default function IfFeature(props) {
  return (configs.feature(props.name) && props.children) || null;
}

IfFeature.propTypes = {
  name: PropTypes.string,
  children: PropTypes.node
};
