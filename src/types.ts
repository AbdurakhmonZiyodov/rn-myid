export type MyIdLocale = 'uz' | 'uz-cyrl' | 'ru' | 'en';

export type MyIdEnvironment = 'production' | 'debug';

export interface MyIdConfig {
  clientHash: string;
  clientHashId: string;
  environment?: MyIdEnvironment;
}

export interface MyIdStartOptions {
  sessionId: string;
  locale?: MyIdLocale;
}

export interface MyIdResult {
  code: string;
  image?: string;
  imageFormat?: 'jpeg' | 'png';
}
