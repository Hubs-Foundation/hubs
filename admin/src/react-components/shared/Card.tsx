import React, { Children, ReactNode } from 'react';

type CardPropsT = {
  children: ReactNode;
  classProp?: string;
};

const Card = ({ children, classProp }: CardPropsT) => {
  return (
    <div className={`${classProp} card `}>
      <>{children}</>
    </div>
  );
};

export default Card;
