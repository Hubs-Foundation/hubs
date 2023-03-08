import React, { MutableRefObject, useCallback, useEffect, useRef } from "react";
import { EntityID } from "../../utils/networking-types";
import styles from "./ObjectContextMenu.scss";
import classNames from "classnames";
import { carryObject, CarryStateData, clearObjectMenu } from "../../bit-systems/carry-system";

export function ObjectContextMenu({ activeObject, menuPos: [x, y] }: CarryStateData) {
  const menuRef: MutableRefObject<HTMLElement | null> = useRef(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as any)) return;
      clearObjectMenu();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      clearObjectMenu();
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuRef.current]);

  const onCarryClicked = useCallback(
    function () {
      carryObject(activeObject);
    },
    [activeObject]
  );

  return (
    <div
      ref={ref => (menuRef.current = ref)}
      className={styles.objectContextMenu}
      style={{
        left: x,
        top: y
      }}
    >
      <div className={classNames(styles.menuItem, "disabled")}>Transform</div>
      <div className={styles.menuItem} onClick={onCarryClicked}>
        Carry
      </div>
    </div>
  );
}
