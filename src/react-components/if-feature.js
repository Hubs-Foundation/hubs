import configs from "../utils/configs";

export default function IfFeature(props) {
  return (configs.feature(props.name) && props.children) || null;
}
