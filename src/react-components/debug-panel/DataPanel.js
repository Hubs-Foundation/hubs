import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { DataGraph } from "./DataGraph.js";
import { Prop, CreatePropsFromData } from "./Prop.js";
import styles from "./DataPanel.scss";

export function DataPanel({
  graphData,
  speed,
  width,
  height,
  data,
  xAxis,
  yAxis,
  title,
  children,
  color,
  backgroundColor
}) {
  return (
    <div className={classNames(styles.dataTile)} style={{ backgroundColor: backgroundColor }}>
      <p className={classNames(styles.dataTileTitle)}>{title}</p>
      {graphData && (
        <div
          style={{
            position: "relative",
            width: width || "auto",
            height: height || "auto",
            alignSelf: "center",
            flex: "0 0 auto"
          }}
        >
          <DataGraph
            width={width || "auto"}
            height={height || "auto"}
            options={{ context: "2d" }}
            data={graphData}
            color={color || "rgb(0, 0, 255)"}
            xAxis={xAxis}
            yAxis={yAxis}
          />
        </div>
      )}
      {speed && <Prop propKey={`speed`} propValue={`${speed} Kb/sec`} />}
      {CreatePropsFromData(data)}
      {children}
    </div>
  );
}

DataPanel.propTypes = {
  graphData: PropTypes.array,
  speed: PropTypes.string,
  data: PropTypes.object,
  xAxis: PropTypes.string,
  yAxis: PropTypes.string,
  title: PropTypes.node,
  children: PropTypes.node,
  width: PropTypes.string,
  height: PropTypes.string,
  color: PropTypes.string,
  backgroundColor: PropTypes.string
};
