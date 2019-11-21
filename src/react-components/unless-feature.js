import configs from "../utils/configs";

export default function UnlessFeature(props) {
  return (!configs.feature(props.name) && props.children) || null;
}
