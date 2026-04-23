"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MyIdError = void 0;
class MyIdError extends Error {
  constructor(kind, message, code) {
    super(message);
    this.name = 'MyIdError';
    this.kind = kind;
    this.code = code;
    Object.setPrototypeOf(this, MyIdError.prototype);
  }
}
exports.MyIdError = MyIdError;
//# sourceMappingURL=errors.js.map