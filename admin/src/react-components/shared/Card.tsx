import React, { ReactNode } from "react";

type CardPropsT = {
  children: ReactNode;
  className?: string;
};

const Card = ({ children, className }: CardPropsT) => {
  return (
    <div className={`${className} card `}>
      <>{children}</>
    </div>
  );
};

export default Card;
