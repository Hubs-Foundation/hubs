import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { RadioInputField } from "../input/RadioInputField";
import { RadioInputOption } from "../input/RadioInput";
import { Button } from "../input/Button";
import { CloseButton } from "../input/CloseButton";
import { useForm } from "react-hook-form";
import styles from "./Banner.scss";
import { ReactComponent as ArrowIcon } from "../icons/Arrow.svg";
import critical from "../../assets/images/critical.png";
import { TextInputField } from "../input/TextInputField";
import { CheckboxInput } from "../input/CheckboxInput";
import { FormattedMessage } from "react-intl";
import cone from "../../assets/images/cone.png";

const Banner = () => {
  const [confirm, setConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [responseStatus, setResponseStatus] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { handleSubmit, register } = useForm({
    defaultValues: {
      email_format: "html"
    }
  });

  /**
   * On Form Error
   */
  const newsletterError = () => {
    setResponseStatus(false);
    setSubmitted(true);
  };

  /**
   * On Form Success
   */
  const newsletterSuccess = () => {
    setResponseStatus(true);
    setSubmitted(true);
  };

  /**
   * On AJAX Resp
   * @param {Basket Response} resp
   * @returns
   */
  const handleResponse = resp => {
    const { status, statusText } = resp;

    if (status !== 200) {
      newsletterError();
      return;
    }

    if (statusText !== "OK") {
      newsletterError();
      return;
    }

    // Do success stuff here..
    newsletterSuccess();
  };

  const onSubmit = useCallback(async data => {
    const url = "https://hubsfoundation.org/mailing-list-sign-up/";
    const body =
      "email=" +
      encodeURIComponent(data.email) +
      "&format=" +
      encodeURIComponent(data.email_format) +
      "&newsletters=" +
      "hubs" +
      "&lang=" +
      encodeURIComponent(navigator.language) +
      "&source_url=" +
      encodeURIComponent(window.location.origin);

    try {
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body
      }).then(handleResponse);
    } catch (error) {
      console.error(error);
      newsletterError();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  /**
   * Checkbox Confirm
   */
  const onConfirm = useCallback(() => {
    setConfirm(state => !state);
  }, []);

  /**
   * Checkbox Label
   * @returns JSX
   */
  const Label = () => {
    return (
      <>
        I&apos;m okay with the Hubs Foundation handling my info as explained in this{" "}
        <a href="https://hubsfoundation.org/privacy-policy/" rel="noopener noreferrer" target="_blank">
          Privacy Notice
        </a>
      </>
    );
  };

  /**
   * Post Submit Message
   * @param {Boolean} param
   * @returns JSX
   */
  const Messaging = ({ status }) => {
    return <>{status ? <Success /> : <Error />}</>;
  };
  Messaging.propTypes = {
    status: PropTypes.bool
  };

  /**
   * Success Message
   * @returns JSX
   */
  const Success = () => {
    return (
      <div className={styles.message_wrapper}>
        <img
          src={cone}
          className={styles.success_image}
          alt={<FormattedMessage defaultMessage="celebrate" id="banner.celebrate-alt" />}
        />
        <div>
          <h3 className={styles.message_title}>
            <FormattedMessage defaultMessage="You're on the list" id="banner.success-title" />
          </h3>
          <p className={styles.message_body}>
            <FormattedMessage
              defaultMessage="Keep an eye out for product updates and an invite to join us as a tester."
              id="banner.success-message"
            />
          </p>
          <Button
            preset="primary"
            className={styles.primary_override}
            onClick={() => {
              setIsExpanded(false);
            }}
          >
            <FormattedMessage defaultMessage="Got it" id="banner.success-cta" />
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Error Message
   * @returns JSX
   */
  const Error = () => {
    return (
      <div className={styles.message_wrapper}>
        <div>
          <img
            src={critical}
            className={styles.error_icon}
            alt={<FormattedMessage defaultMessage="warning" id="banner.warning-alt" />}
          />
        </div>
        <div>
          <h3 className={styles.error_message_title}>
            <FormattedMessage defaultMessage="We ran into a problem" id="banner.error-title" />
          </h3>

          <p className={styles.message_body}>
            <FormattedMessage
              defaultMessage="{message}"
              id="banner.error-body"
              values={{
                message: (
                  <>
                    Sorry, we were unable to add you to the mailing list, please try again later. If the problem
                    persists please reach out on our{" "}
                    <a href="https://discord.com/invite/dFJncWwHun" rel="noopener noreferrer" target="_blank">
                      Discord
                    </a>
                    .
                  </>
                )
              }}
            />
          </p>
          <Button
            preset="primary"
            className={styles.primary_override}
            onClick={() => {
              setIsExpanded(false);
            }}
          >
            <FormattedMessage defaultMessage="Got it" id="banner.error-cta" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={styles.banner_gradient} />
      <div className={styles.banner_wrapper}>
        <div className={styles.banner_container}>
          {/* BRANDING  */}
          <div className={styles.branding_container}>
            <h2>
              <FormattedMessage defaultMessage="Join the next evolution of Hubs!" id="banner.title" />
            </h2>
            <p>
              <FormattedMessage defaultMessage="Be the first to get a sneak peek!" id="banner.subtitle" />
            </p>
          </div>

          <Button
            preset="primary"
            className={styles.primary_override}
            onClick={() => {
              setIsExpanded(true);
            }}
          >
            <FormattedMessage defaultMessage="Find out More" id="banner.expand-cta" />
            <span className={styles.down_arrow}>
              <ArrowIcon />
            </span>
          </Button>
        </div>

        {/* EXPAND CONTAINER  */}
        {isExpanded ? (
          <div className={styles.expand_wrapper}>
            <div className={styles.expand_container}>
              <div className={styles.expand_header}>
                <h2>
                  <FormattedMessage defaultMessage="Join the next evolution of Hubs!" id="banner.expand-title" />
                </h2>
                <CloseButton
                  className={styles.close_button}
                  onClick={() => {
                    setIsExpanded(false);
                  }}
                />
              </div>

              <div className={styles.expand_contents}>
                {/* MESSAGING  */}
                <div className={styles.expand_messaging}>
                  <p>
                    <FormattedMessage
                      defaultMessage="{message}"
                      id="banner.expand-body"
                      values={{
                        message: (
                          <>
                            We&apos;re working on a new service that makes it easier than ever to deploy a Hub of your
                            own.
                          </>
                        )
                      }}
                    />
                  </p>

                  <p>
                    <FormattedMessage
                      defaultMessage="{message}"
                      id="banner.expand-body-two"
                      values={{
                        message: (
                          <>
                            Sign up here to get updates on what is new with Hubs and we will keep you up to date with
                            the latest news, updates, and product offerings. We can&apos;t wait to show you what we have
                            been working on!
                          </>
                        )
                      }}
                    />
                  </p>
                </div>

                {/* FORM  */}
                <form className={styles.expand_form} onSubmit={handleSubmit(onSubmit)}>
                  {submitted ? (
                    <Messaging status={responseStatus} />
                  ) : (
                    <div className={styles.expand_form_fields}>
                      <TextInputField
                        {...register("email", {
                          required: true
                        })}
                        type="email"
                        label={<FormattedMessage id="banner.email-address" defaultMessage="Email Address" />}
                        placeholder="name@email.com"
                        className={styles.expand_form_field}
                      />

                      <RadioInputField
                        className={styles.expand_form_field}
                        label={<FormattedMessage id="banner.format-label" defaultMessage="Format" />}
                      >
                        <RadioInputOption
                          className={styles.radio_override}
                          value="html"
                          label={<FormattedMessage id="banner.format-html" defaultMessage="HTML" />}
                          {...register("email_format")}
                        />
                        <RadioInputOption
                          className={styles.radio_override}
                          value="text"
                          label={<FormattedMessage id="banner.format-text" defaultMessage="Text" />}
                          {...register("email_format")}
                        />
                      </RadioInputField>

                      <CheckboxInput
                        className={styles.expand_checkbox_field}
                        labelClassName={styles.checkbox_label}
                        tabIndex="0"
                        type="checkbox"
                        checked={confirm}
                        label={<Label />}
                        onChange={onConfirm}
                      />

                      {/* ACTIONS  */}
                      <div className={styles.expand_actions}>
                        <Button type="submit" preset="primary" className={styles.primary_override} disabled={!confirm}>
                          <FormattedMessage defaultMessage="Join the Mailing List" id="banner.form-cta" />
                        </Button>
                        <Button
                          className={styles.clear_override}
                          onClick={() => {
                            setIsExpanded(false);
                          }}
                        >
                          <FormattedMessage defaultMessage="Not Interested" id="banner.form-decline" />
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        ) : (
          ""
        )}
      </div>
    </>
  );
};

export default Banner;
