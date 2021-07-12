import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./ButtonGridPopover.scss";
import liststyle from "./ListGridPopover.scss";
import { ReactComponent as PlusCircleIcon } from "../icons/PlusCircle.svg";
export function ListGridPopover({ fullscreen }) {
  // console.log("🚀 ~ file: ListGridPopover.js ~ line 8 ~ ListGridPopover ~ items", items);
  return (
    <div className={classNames(styles.buttonGridPopover, { [styles.fullscreen]: fullscreen })}>
      <ul className={classNames(liststyle.listGridPopover)}>
        <li className={classNames(liststyle.list)}>
          <span>{"Username 1"}</span>
          <span>
            <PlusCircleIcon />
          </span>
        </li>
        <li className={classNames(liststyle.list)}>
          <span>{"Username 2"}</span>
          <span>
            <PlusCircleIcon />
          </span>
        </li>
        <li className={classNames(liststyle.list)}>
          <span>{"Username 3"}</span>
          <span>
            <PlusCircleIcon />
          </span>
        </li>
        <li className={classNames(liststyle.list)}>
          <span>{"Username 4"}</span>
          <span>
            <PlusCircleIcon />
          </span>
        </li>
        <li className={classNames(liststyle.list)}>
          <span>{"Username 5"}</span>
          <span>
            <PlusCircleIcon />
          </span>
        </li>
      </ul>
    </div>
  );
}

ListGridPopover.propTypes = {
  fullscreen: PropTypes.bool,
  // items: PropTypes.arrayOf(
  //   PropTypes.shape({
  //     id: PropTypes.string.isRequired,
  //     icon: PropTypes.elementType.isRequired,
  //     color: PropTypes.string,
  //     name: PropTypes.string.isRequired,
  //     onSelect: PropTypes.func
  //   })
  // ).isRequired,
  closePopover: PropTypes.func.isRequired
};
