"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MyId = void 0;
var _reactNative = require("react-native");
var _NativeMyId = _interopRequireDefault(require("./NativeMyId"));
var _errors = require("./errors");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const LINKING_ERROR = `The package 'rn-myid' doesn't seem to be linked. Make sure: \n\n` + _reactNative.Platform.select({
  ios: "- You have run 'pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n';
let currentConfig = null;
let inFlight = false;
function getNative() {
  const mod = _NativeMyId.default ?? _reactNative.NativeModules.RNMyId;
  if (!mod) {
    throw new _errors.MyIdError('UNAVAILABLE', LINKING_ERROR);
  }
  return mod;
}
function mapEnvironment(env) {
  return env === 'debug' ? 'DEBUG' : 'PRODUCTION';
}
function mapLocale(locale) {
  const normalized = locale.toLowerCase();
  if (normalized === 'uz-cyrl' || normalized === 'cyrl' || normalized === 'uz-cyrillic') {
    return 'uz-cyrl';
  }
  if (normalized.startsWith('ru')) return 'ru';
  if (normalized.startsWith('en')) return 'en';
  return 'uz';
}
function configure(config) {
  if (!config.clientHash || !config.clientHashId) {
    throw new _errors.MyIdError('NOT_CONFIGURED', 'MyId.configure requires both clientHash and clientHashId');
  }
  currentConfig = {
    environment: 'production',
    ...config
  };
}
function isAvailable() {
  const mod = _NativeMyId.default ?? _reactNative.NativeModules.RNMyId;
  if (!mod) return false;
  try {
    return typeof mod.isAvailable === 'function' ? mod.isAvailable() : true;
  } catch {
    return false;
  }
}
function isConfigured() {
  return currentConfig !== null;
}
function start(options) {
  return new Promise((resolve, reject) => {
    if (!currentConfig) {
      reject(new _errors.MyIdError('NOT_CONFIGURED', 'MyId.start called before MyId.configure'));
      return;
    }
    if (inFlight) {
      reject(new _errors.MyIdError('ALREADY_RUNNING', 'MyId session already in progress'));
      return;
    }
    if (!options?.sessionId) {
      reject(new _errors.MyIdError('SDK_ERROR', 'sessionId is required'));
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
    const emitter = new _reactNative.NativeEventEmitter(native);
    const subs = [emitter.addListener('onSuccess', event => {
      cleanup();
      if (!event?.code) {
        reject(new _errors.MyIdError('SDK_ERROR', 'MyId returned empty code'));
        return;
      }
      resolve({
        code: event.code,
        image: event.image,
        imageFormat: event.image ? _reactNative.Platform.OS === 'ios' ? 'jpeg' : 'png' : undefined
      });
    }), emitter.addListener('onError', event => {
      cleanup();
      reject(new _errors.MyIdError('SDK_ERROR', event?.message ?? 'MyId SDK error', event?.code));
    }), emitter.addListener('onUserExited', () => {
      cleanup();
      reject(new _errors.MyIdError('USER_EXITED', 'User cancelled MyId session'));
    })];
    const cleanup = () => {
      inFlight = false;
      subs.forEach(s => s.remove());
    };
    try {
      native.start(options.sessionId, currentConfig.clientHash, currentConfig.clientHashId, mapEnvironment(currentConfig.environment ?? 'production'), mapLocale(options.locale ?? 'uz'));
    } catch (e) {
      cleanup();
      reject(new _errors.MyIdError('SDK_ERROR', e?.message ?? 'Failed to start MyId session'));
    }
  });
}
const MyId = exports.MyId = {
  configure,
  isAvailable,
  isConfigured,
  start
};
//# sourceMappingURL=MyId.js.map