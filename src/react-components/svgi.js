import PropTypes from "prop-types";
import React from "react";

function InlineSVG(props) {
  const filteredProps = { ...props };
  delete filteredProps.src;
  return <div {...filteredProps} dangerouslySetInnerHTML={{ __html: props.src }} />;
}

InlineSVG.propTypes = {
  src: PropTypes.string
};

function InlineSVGButton(props) {
  const filteredProps = { ...props };
  delete filteredProps.src;
  return <button {...filteredProps} dangerouslySetInnerHTML={{ __html: props.src }} />;
}

InlineSVGButton.propTypes = {
  src: PropTypes.string
};

export { InlineSVG, InlineSVGButton };
