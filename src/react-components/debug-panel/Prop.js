import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Prop.scss";

export function CreatePropsFromData(data) {
  const props = [];
  for (const property in data) {
    let value = data[property];
    if (typeof value === "number" && !!(value % 1)) {
      value = value.toFixed(2);
      props.push(<Prop key={property} propKey={property} propValue={value} />);
    } else if (typeof value === "object") {
      props.push(<Prop key={property} propKey={property} propValue={"-"} />);
      props.push(CreatePropsFromData(value));
    } else {
      props.push(<Prop key={property} propKey={property} propValue={value} />);
    }
  }

  return props;
}

export function Prop({ propKey, propValue }) {
  return (
    (propKey !== undefined && propValue !== undefined && (
      <p className={classNames(styles.rtcTileText)}>
        {`${propKey}: `}
        <span className={classNames(styles.rtcValueText)}>{`${propValue}`}</span>
      </p>
    )) ||
    null
  );
}

Prop.propTypes = {
  propKey: PropTypes.string,
  propValue: PropTypes.any
};
