"use strict";

export class MyIdError extends Error {
  constructor(kind, message, code) {
    super(message);
    this.name = 'MyIdError';
    this.kind = kind;
    this.code = code;
    Object.setPrototypeOf(this, MyIdError.prototype);
  }
}
//# sourceMappingURL=errors.js.map