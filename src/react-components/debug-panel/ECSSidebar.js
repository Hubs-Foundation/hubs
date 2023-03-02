/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { CloseButton } from "../input/CloseButton";
import { Sidebar } from "../sidebar/Sidebar";
import styles from "./ECSSidebar.scss";
import { IconButton } from "../input/IconButton";
import { FormattedMessage } from "react-intl";

import * as bitComponents from "../../bit-components";
import { defineQuery, getEntityComponents } from "bitecs";

const bitComponentNames = new Map();
for (const [name, Component] of Object.entries(bitComponents)) {
  bitComponentNames.set(Component, name);
}

export function formatObjectName(obj) {
  const name =
    obj.name ||
    (obj.el ? (obj.el?.id && `#${obj.el.id}`) || `.${obj.el?.className?.replaceAll(" ", ".") || "a-entity"}` : "");
  return name ? `${name}(${obj.constructor.name})` : `${obj.constructor.name}`;
}

function Object3DItem(props) {
  const { obj, toggleObjExpand, setSelectedObj, expanded, expandedIds } = props;

  const displayName = formatObjectName(obj);

  return (
    <div className="obj-item">
      <div
        className="obj-label"
        onClick={() => toggleObjExpand(obj.uuid)}
        onContextMenu={e => {
          e.preventDefault();
          setSelectedObj(obj);
        }}
      >
        <span className="toggle">{obj.children.length === 0 ? " " : expanded ? "-" : "+"}</span>
        {displayName}
        {obj.eid ? ` [${obj.eid}]` : ""}
      </div>
      {expanded && (
        <div>
          {obj.children.map(child => {
            return <Object3DItem {...props} obj={child} expanded={expandedIds.has(child.uuid)} key={child.uuid} />;
          })}
        </div>
      )}
    </div>
  );
}

export function formatComponentProps(eid, component) {
  const formatted = Object.keys(component).reduce((str, k, i, arr) => {
    const val = component[k][eid];
    const isStr = component[k][bitComponents.$isStringType];
    str += `  ${k}: `;
    if (ArrayBuffer.isView(val)) {
      str += JSON.stringify(Array.from(val));
    } else if (isStr) {
      const strVal = APP.getString(val);
      if (strVal === NAF.clientId) {
        str += `${val} *You* "${strVal}"`;
      } else {
        str += `${val} "${strVal}"`;
      }
    } else {
      str += val;
    }
    if (i < arr.length - 1) str += "\n";
    return str;
  }, "");
  return `{\n${formatted}\n}`;
}

function ComponentPill({ eid, component }) {
  const [expand, setExpand] = useState(false);
  const hasProps = Object.keys(component).length;
  const componentProps = expand ? formatComponentProps(eid, component) : hasProps ? "{}" : "";
  return (
    <pre onClick={() => setExpand(!expand)}>
      {bitComponentNames.get(component)} {componentProps}
    </pre>
  );
}

function EntityInfo({ eid }) {
  return (
    <div>
      <div className="components">
        {getEntityComponents(APP.world, eid)
          .sort((a, b) => Object.keys(a).length - Object.keys(b).length)
          .map((Component, i) => (
            <ComponentPill eid={eid} key={i} component={Component} />
          ))}
      </div>
    </div>
  );
}

function ObjectProperties({ obj }) {
  const displayName = obj.name || (obj.el?.id && `#${obj.el.id}`) || (obj.eid && `Entity ${obj.eid}`) || obj.uuid;
  return (
    <div className="obj-properties">
      <div className="title">
        <span>{displayName}</span>
        <button onClick={() => console.log(obj)}>
          <FormattedMessage id="ecs-sidebar.log-button" defaultMessage="log" />
        </button>
      </div>
      <div className="content">{obj.eid && <EntityInfo eid={obj.eid} />}</div>
    </div>
  );
}

function RefreshButton({ onClick }) {
  return (
    <IconButton onClick={onClick}>
      <FormattedMessage id="ecs-sidebar.refresh-icon" defaultMessage="refresh" />
    </IconButton>
  );
}

const object3dQuery = defineQuery([bitComponents.Object3DTag]);
function ECSDebugSidebar({
  onClose,
  toggleObjExpand,
  refreshScenegraph,
  setSelectedObj,
  expandedIds,
  rootObj,
  selectedObj
}) {
  const orphaned = object3dQuery(APP.world)
    .map(eid => APP.world.eid2obj.get(eid))
    .filter(o => !o.parent);
  return (
    <Sidebar
      title="ECS Debug"
      className={styles.ecs}
      beforeTitle={<CloseButton onClick={onClose} />}
      afterTitle={<RefreshButton onClick={refreshScenegraph} />}
    >
      <div className="content">
        <div className="object-list">
          <Object3DItem
            obj={rootObj}
            toggleObjExpand={toggleObjExpand}
            expanded={expandedIds.has(rootObj.uuid)}
            expandedIds={expandedIds}
            setSelectedObj={setSelectedObj}
          />
          {orphaned.map(o => (
            <Object3DItem
              obj={o}
              key={o.eid}
              toggleObjExpand={toggleObjExpand}
              expanded={expandedIds.has(o.uuid)}
              expandedIds={expandedIds}
              setSelectedObj={setSelectedObj}
            />
          ))}
        </div>
        <div className="object-properties">{selectedObj && <ObjectProperties obj={selectedObj} />}</div>
      </div>
    </Sidebar>
  );
}

export function ECSDebugSidebarContainer({ onClose }) {
  const [state, setState] = useState({ expanded: new Set(), rootObj: AFRAME.scenes[0].object3D });
  const [selectedObj, setSelectedObj] = useState(null);
  const [_, forceRefresh] = useState();
  const refreshScenegraph = function () {
    forceRefresh({});
  };
  const toggleObjExpand = function (uuid) {
    if (state.expanded.has(uuid)) {
      state.expanded.delete(uuid);
    } else {
      state.expanded.add(uuid);
    }
    setState({ ...state, expanded: state.expanded });
  };
  return (
    <ECSDebugSidebar
      onClose={onClose}
      toggleObjExpand={toggleObjExpand}
      refreshScenegraph={refreshScenegraph}
      expandedIds={state.expanded}
      setSelectedObj={setSelectedObj}
      selectedObj={selectedObj}
      rootObj={state.rootObj}
    />
  );
}
