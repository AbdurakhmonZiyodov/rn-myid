import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  start(sessionId: string, clientHash: string, clientHashId: string, environment: string, locale: string): void;
  isAvailable(): boolean;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.get<Spec>('RNMyId');
