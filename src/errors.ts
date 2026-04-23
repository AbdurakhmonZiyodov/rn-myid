export type MyIdErrorKind =
  | 'NOT_CONFIGURED'
  | 'UNAVAILABLE'
  | 'ALREADY_RUNNING'
  | 'USER_EXITED'
  | 'SDK_ERROR';

export class MyIdError extends Error {
  readonly kind: MyIdErrorKind;
  readonly code?: number;

  constructor(kind: MyIdErrorKind, message: string, code?: number) {
    super(message);
    this.name = 'MyIdError';
    this.kind = kind;
    this.code = code;
    Object.setPrototypeOf(this, MyIdError.prototype);
  }
}
