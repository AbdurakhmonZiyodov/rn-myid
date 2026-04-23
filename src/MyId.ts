import {NativeEventEmitter, NativeModules, Platform} from 'react-native';
import NativeMyId from './NativeMyId';
import {MyIdError} from './errors';
import type {MyIdConfig, MyIdEnvironment, MyIdResult, MyIdStartOptions} from './types';

const LINKING_ERROR =
  `The package 'rn-myid' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ios: "- You have run 'pod install'\n", default: ''}) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

let currentConfig: MyIdConfig | null = null;
let inFlight = false;

function getNative() {
  const mod = NativeMyId ?? NativeModules.RNMyId;
  if (!mod) {
    throw new MyIdError('UNAVAILABLE', LINKING_ERROR);
  }
  return mod;
}

function mapEnvironment(env: MyIdEnvironment): string {
  return env === 'debug' ? 'DEBUG' : 'PRODUCTION';
}

function mapLocale(locale: string): 'uz' | 'uz-cyrl' | 'ru' | 'en' {
  const normalized = locale.toLowerCase();
  if (normalized === 'uz-cyrl' || normalized === 'cyrl' || normalized === 'uz-cyrillic') {
    return 'uz-cyrl';
  }
  if (normalized.startsWith('ru')) return 'ru';
  if (normalized.startsWith('en')) return 'en';
  return 'uz';
}

function configure(config: MyIdConfig): void {
  if (!config.clientHash || !config.clientHashId) {
    throw new MyIdError('NOT_CONFIGURED', 'MyId.configure requires both clientHash and clientHashId');
  }
  currentConfig = {
    environment: 'production',
    ...config,
  };
}

function isAvailable(): boolean {
  return (NativeMyId ?? NativeModules.RNMyId) != null;
}

function isConfigured(): boolean {
  return currentConfig !== null;
}

function start(options: MyIdStartOptions): Promise<MyIdResult> {
  return new Promise<MyIdResult>((resolve, reject) => {
    if (!currentConfig) {
      reject(new MyIdError('NOT_CONFIGURED', 'MyId.start called before MyId.configure'));
      return;
    }
    if (inFlight) {
      reject(new MyIdError('ALREADY_RUNNING', 'MyId session already in progress'));
      return;
    }
    if (!options?.sessionId) {
      reject(new MyIdError('SDK_ERROR', 'sessionId is required'));
      return;
    }

    let native;
    try {
      native = getNative();
    } catch (e) {
      reject(e);
      return;
    }

    inFlight = true;
    const emitter = new NativeEventEmitter(native);
    const subs = [
      emitter.addListener('onSuccess', (event: {code?: string; image?: string}) => {
        cleanup();
        if (!event?.code) {
          reject(new MyIdError('SDK_ERROR', 'MyId returned empty code'));
          return;
        }
        resolve({
          code: event.code,
          image: event.image,
          imageFormat: event.image ? (Platform.OS === 'ios' ? 'jpeg' : 'png') : undefined,
        });
      }),
      emitter.addListener('onError', (event: {message?: string; code?: number}) => {
        cleanup();
        reject(new MyIdError('SDK_ERROR', event?.message ?? 'MyId SDK error', event?.code));
      }),
      emitter.addListener('onUserExited', () => {
        cleanup();
        reject(new MyIdError('USER_EXITED', 'User cancelled MyId session'));
      }),
    ];

    const cleanup = () => {
      inFlight = false;
      subs.forEach(s => s.remove());
    };

    try {
      native.start(
        options.sessionId,
        currentConfig.clientHash,
        currentConfig.clientHashId,
        mapEnvironment(currentConfig.environment ?? 'production'),
        mapLocale(options.locale ?? 'uz'),
      );
    } catch (e: any) {
      cleanup();
      reject(new MyIdError('SDK_ERROR', e?.message ?? 'Failed to start MyId session'));
    }
  });
}

export const MyId = {
  configure,
  isAvailable,
  isConfigured,
  start,
};
