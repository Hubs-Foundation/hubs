import Raven from "raven-js";

export default function registerTelemetry() {
  if (process.env.NODE_ENV === "production") {
    Raven.config("https://013d6a364fed43cdb0539a61d520597a@sentry.prod.mozaws.net/370").install();
  }
}
