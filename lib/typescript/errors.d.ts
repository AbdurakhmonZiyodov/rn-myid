export type MyIdErrorKind = 'NOT_CONFIGURED' | 'UNAVAILABLE' | 'ALREADY_RUNNING' | 'USER_EXITED' | 'SDK_ERROR';
export declare class MyIdError extends Error {
    readonly kind: MyIdErrorKind;
    readonly code?: number;
    constructor(kind: MyIdErrorKind, message: string, code?: number);
}
//# sourceMappingURL=errors.d.ts.map