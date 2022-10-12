// eslint-disable-next-line no-unused-vars
import React, { Children } from "react";

export function joinChildren(children, renderSeparator) {
  const result = Children.toArray(children).reduce(
    (acc, child) =>
      acc === null ? (
        child
      ) : (
        <>
          {acc}
          {renderSeparator()}
          {child}
        </>
      ),
    null
  );

  return result;
}
