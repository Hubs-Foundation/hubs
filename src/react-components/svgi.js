import PropTypes from "prop-types";
import React from "react";

function SVGI(props) {
  const filteredProps = { ...props };
  delete filteredProps.src;
  return <div {...filteredProps} dangerouslySetInnerHTML={{ __html: props.src }} />;
}

SVGI.propTypes = {
  src: PropTypes.string
};

function SVGIButton(props) {
  const filteredProps = { ...props };
  delete filteredProps.src;
  return <button {...filteredProps} dangerouslySetInnerHTML={{ __html: props.src }} />;
}

SVGIButton.propTypes = {
  src: PropTypes.string
};

export { SVGI, SVGIButton };
