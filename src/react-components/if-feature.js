import { useContext } from "react";
import PropTypes from "prop-types";
import configs from "../utils/configs";
import { AuthContext } from "./auth/AuthContext";

export default function IfFeature(props) {
  // configs.feature("enable_spoke") depends on admin state.
  // Subscribe to auth changes so this component re-renders when that state resolves.
  useContext(AuthContext);

  return (configs.feature(props.name) && props.children) || null;
}

IfFeature.propTypes = {
  name: PropTypes.string,
  children: PropTypes.node
};
