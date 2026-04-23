import type { TurboModule } from 'react-native';
export interface Spec extends TurboModule {
    start(sessionId: string, clientHash: string, clientHashId: string, environment: string, locale: string): void;
    isAvailable(): boolean;
    addListener(eventName: string): void;
    removeListeners(count: number): void;
}
declare const _default: Spec | null;
export default _default;
//# sourceMappingURL=NativeMyId.d.ts.map