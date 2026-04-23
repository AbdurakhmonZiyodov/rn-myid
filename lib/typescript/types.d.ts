export type MyIdLocale = 'uz' | 'uz-cyrl' | 'ru' | 'en';
export type MyIdEnvironment = 'production' | 'debug';
export interface MyIdConfig {
    clientHash: string;
    clientHashId: string;
    environment?: MyIdEnvironment;
}
export interface MyIdStartOptions {
    sessionId: string;
    /**
     * Recognized values: 'uz' | 'uz-cyrl' | 'cyrl' | 'ru' | 'en'.
     * Any other value (or unset) falls back to 'uz'.
     * Typed as string so consumers can pass i18n.language directly.
     */
    locale?: MyIdLocale | string;
}
export interface MyIdResult {
    code: string;
    image?: string;
    imageFormat?: 'jpeg' | 'png';
}
//# sourceMappingURL=types.d.ts.map