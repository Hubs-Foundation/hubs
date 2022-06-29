import React, { useState, useCallback } from "react";
import { RadioInputField } from "../input/RadioInputField";
import { RadioInputOption } from "../input/RadioInput";
import { Button } from "../input/Button";
import { CloseButton } from "../input/CloseButton";
import { useForm } from "react-hook-form";
import styles from "./Banner.scss";
import { ReactComponent as ArrowIcon } from "../icons/Arrow.svg";
import warning_icon from "../../assets/images/warning_icon.png";
import { TextInputField } from "../input/TextInputField";
import { CheckboxInput } from "../input/CheckboxInput";
import { FormattedMessage } from "react-intl";
import cone from "../../assets/images/cone.png";

const Banner = () => {
  const [email, setEmail] = useState("");
  const [confirm, setConfirm] = useState(true);
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
   * On XHR Load
   * @param {Basket Response} resp
   * @returns
   */
  const onload = resp => {
    // Check Target Status
    const status = resp.target.status;
    if (status !== 200 || status > 300 || status < 200) {
      newsletterError();
      return;
    }

    // Check Response Status
    let response = resp.target.response;
    typeof response !== "object" ? (response = JSON.parse(response)) : "";
    if (response.status !== "ok") {
      newsletterError();
      return;
    }

    // Do success stuff here..
    newsletterSuccess();
  };

  const onSubmit = async data => {
    // Note: this is a pattern that was suggesed by the basket creator
    const url = "https://basket.mozilla.org/news/subscribe/";
    const xhr = new XMLHttpRequest();
    const params =
      "email=" +
      encodeURIComponent(data.email) +
      "&newsletters=" +
      "hubs" +
      "&lang=" +
      encodeURIComponent(navigator.languages[0]) +
      "&source_url=" +
      encodeURIComponent(window.location);

    xhr.onload = onload;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.timeout = 5000;
    xhr.ontimeout = newsletterError;
    xhr.responseType = "json";
    xhr.send(params);
  };

  /**
   * Emain input change
   */
  const onChangeEmail = useCallback(
    e => {
      setEmail(e.target.value);
    },
    [setEmail]
  );

  /**
   * Checkbox Confirm
   */
  const onConfirm = () => {
    setConfirm(state => !state);
  };

  /**
   * Checkbox Label
   * @returns JSX
   */
  const Label = () => {
    return (
      <>
        I&apos;m okay with Mozilla handling my info as explained in this{" "}
        <a href="https://github.com/mozilla/hubs/blob/master/PRIVACY.md" rel="noopener noreferrer" target="_blank">
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

  /**
   * Success Message
   * @returns JSX
   */
  const Success = () => {
    return (
      <div className={styles.message_wrapper}>
        <img src={cone} className={styles.success_image} />
        <div>
          <h3 className={styles.message_title}>
            <FormattedMessage defaultMessage="You're on the list" id="banner.success-title" />
          </h3>
          <p className={styles.message_body}>
            <FormattedMessage
              defaultMessage="Keep an eye out for product updates and an invite to join us as a tester in August."
              id="banner.success-message"
            />
          </p>
          <Button
            preset="primary"
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
          <img src={warning_icon} className={styles.error_icon} />
        </div>
        <div>
          <h3 className={styles.message_title}>
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
                    </a>.
                  </>
                )
              }}
            />
          </p>
          <Button
            preset="primary"
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
              <h2 className={styles.expand_title}>
                <FormattedMessage defaultMessage="Join the next evolution of Hubs!" id="banner.expand_title" />
              </h2>
              <CloseButton
                onClick={() => {
                  setIsExpanded(false);
                }}
              />
            </div>

            <div className={styles.expand_contents}>
              {/* MESSAGING  */}
              <div className={styles.expand_messaging}>
                <FormattedMessage
                  defaultMessage="{message}"
                  id="banner.expand-body"
                  values={{
                    message:<>We&apos;re working on a new service that makes it easier than ever to deploy a Hub of your own. Sign up here to be the first to know about our new service, as well as the latest Hubs news, product features and offerings. We can&apos;t wait to show you what we&apos;ve been working on!</>
                  }}
                />
              </div>

              {/* FORM  */}
              <form className={styles.expand_form} onSubmit={handleSubmit(onSubmit)}>
                {submitted ? (
                  <Messaging status={responseStatus} />
                ) : (
                  <div>
                    <TextInputField
                      ref={register}
                      name="email"
                      type="email"
                      label={<FormattedMessage id="email-address" defaultMessage="Email Address" />}
                      required
                      value={email}
                      onChange={onChangeEmail}
                      placeholder="example@example.com"
                      className={styles.expand_form_field}
                    />

                    <RadioInputField className={styles.expand_form_field} label="Format">
                      <RadioInputOption name="email_format" value="html" label="HTML" ref={register} />
                      <RadioInputOption name="email_format" value="text" label="Text" ref={register} />
                    </RadioInputField>

                    <CheckboxInput
                      className={styles.expand_form_field}
                      labelClassName={styles.checkbox_label}
                      tabIndex="0"
                      type="checkbox"
                      checked={confirm}
                      label={<Label />}
                      onChange={onConfirm}
                    />

                    {/* ACTIONS  */}
                    <div className={styles.expand_actions}>
                      <Button type="submit" preset="primary" disabled={!confirm}>
                        <FormattedMessage defaultMessage="Join the Mailing List" id="banner.form-cta" />
                      </Button>
                      <Button
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
  );
};

export default Banner;
