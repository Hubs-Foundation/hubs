export function eventToMessage(event) {
  if (!event) return "";
  if (event.message) return event.message;
  const target = event.target;
  if (target) {
    if (event.target.error && event.target.error.message) return target.error.message;
    if (event.target.src) return `Failed to load "${target.src}"`;
    if (target instanceof XMLHttpRequest) {
      return `Network Error: ${target.status || "Unknown Status."} ${target.statusText ||
        "Unknown Error. Possibly a CORS error."}`;
    }

    return `Unknown error on ${target}.`;
  }
  return `Unknown error: "${JSON.stringify(event)}"`;
}

// Base error class to be used for all custom errors.
export class BaseError extends Error {
  constructor(message) {
    super(message);

    this.name = this.constructor.name;
    this.message = message;

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

// Override the message of an error but append the existing stack trace.
export class RethrownError extends BaseError {
  constructor(message, error) {
    super(`${message}:\n  Cause:\n    ${eventToMessage(error).replace(/\n/g, "\n    ")}`);
    this.originalError = error;
    this.stack += "\n" + error.stack;
  }
}

// Output messages for multiple errors.
//
// Example: new MultiError("Error loading project", errors);
// Output:
//  Error loading project:
//
//  2 Errors:
//    Model "Example Model" could not be loaded:
//      Cause:
//        Network Error: Unknown error. Possibly caused by improper CORS headers.
//    Image "Example Image" could not be loaded.
//      Network Error: 404 Page not found.
export class MultiError extends BaseError {
  constructor(message, errors) {
    let finalMessage = `${message}:\n\n${errors.length} Error${errors.length > 1 ? "s" : ""}:`;

    for (const error of errors) {
      const errorMessage = error.message ? error.message.replace(/\n/g, "\n  ") : "Unknown Error";
      finalMessage += "\n  " + errorMessage;
    }

    super(finalMessage);
  }
}
