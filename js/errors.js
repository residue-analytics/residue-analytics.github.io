

// From : https://stackoverflow.com/questions/44447847/enums-in-javascript-with-es6
const ResErrorCode = Object.freeze({
  NO_DATA: 4040,
  MULT_DATA: 8080,
  SERVER: {
    NO_DATA: 404,
    INTERNAL: 500,
    UNKNOWN: 999
  },
  UNKNOWN: 9999
});

class ResError extends Error {
  constructor(code = ResErrorCode.UNKNOWN, ...params) {
    // From : https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ResError)
    }

    this.name = this.constructor.name;
    this.code = code;
  }

  toString() {
    return this.name + "[" + this.code + "] " + super.toString();
  }
}