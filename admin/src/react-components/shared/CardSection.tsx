import React from 'react';
import { Icon, Button, ButtonSizesE } from '@mozilla/lilypad-ui';

type CardSectionPropsT = {
  cta: string;
  ctaLabel?: string;
  ctaCallback: () => void;
  body: string;
};

const CardSection = ({
  cta,
  ctaLabel,
  ctaCallback,
  body,
}: CardSectionPropsT) => {
  return (
    <div className="flex-box mb-28">
      <div className="flex-align-items-center mb-20">
        <div>
          <Icon name="arrow-right-circle" size={30} classProp="mr-20" />
        </div>
        <p className="body-md">{body}</p>
      </div>
      <Button
        onClick={ctaCallback}
        label={ctaLabel ? ctaLabel : cta}
        size={ButtonSizesE.SMALL}
        text={cta}
      />
    </div>
  );
};

export default CardSection;
