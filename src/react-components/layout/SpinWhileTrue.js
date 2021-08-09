import React from "react";
import PropTypes from "prop-types";
import { Spinner } from "../misc/Spinner";
import { Center } from "./Center";

export function SpinWhileTrue({ isSpinning, children }) {
  return (
    <>
      {isSpinning ? (
        <Center>
          <Spinner />
        </Center>
      ) : (
        <>{children}</>
      )}
    </>
  );
}

SpinWhileTrue.propTypes = {
  isSpinning: PropTypes.bool.isRequired
};
