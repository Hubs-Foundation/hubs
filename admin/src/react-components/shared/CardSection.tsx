import React from "react";
import { Icon, Button, ButtonSizesE } from "@mozilla/lilypad-ui";

type CardSectionPropsT = {
  cta: string;
  ctaLabel?: string;
  ctaCallback: () => void;
  body: string;
  className?: string;
};

const CardSection = ({ cta, ctaLabel, ctaCallback, body, className }: CardSectionPropsT) => {
  return (
    <div className={`card_section_wrapper ${className}`}>
      <div className="flex-align-items-center max-w-800-px">
        <div>
          <Icon name="arrow-right-circle" size={30} classProp="mr-20" />
        </div>
        <p className="body-md mr-10">{body}</p>
      </div>

      <div className="flex-box">
        <Button
          onClick={ctaCallback}
          label={ctaLabel ? ctaLabel : cta}
          size={ButtonSizesE.SMALL}
          text={cta}
          classProp="nowrap"
        />
      </div>
    </div>
  );
};

export default CardSection;
