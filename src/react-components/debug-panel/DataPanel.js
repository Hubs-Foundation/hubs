import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Prop, CreatePropsFromData } from "./Prop.js";
import styles from "./DataPanel.scss";

export function DataPanel({ graphData, speed, data, title, children }) {
  return (
    <div className={classNames(styles.dataTile)}>
      <p className={classNames(styles.dataTileTitle)}>{title}</p>
      {graphData && (
        <div style={{ display: "flex", width: "150px", height: "50px", alignSelf: "center" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={graphData}>
              <Area type="monotone" dataKey="bytesSent" stroke="#00ff00" fill="#00ff00" isAnimationActive={false} />
              <Area type="monotone" dataKey="packetsSent" stroke="#0000ff" fill="#0000ff" isAnimationActive={false} />
              <Area type="monotone" dataKey="bytesReceived" stroke="#00ff00" fill="#00ff00" isAnimationActive={false} />
              <Area
                type="monotone"
                dataKey="packetsReceived"
                stroke="#0000ff"
                fill="#0000ff"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
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
  title: PropTypes.string,
  children: PropTypes.node
};
