import type { MyIdConfig, MyIdResult, MyIdStartOptions } from './types';
declare function configure(config: MyIdConfig): void;
declare function isAvailable(): boolean;
declare function isConfigured(): boolean;
declare function start(options: MyIdStartOptions): Promise<MyIdResult>;
export declare const MyId: {
    configure: typeof configure;
    isAvailable: typeof isAvailable;
    isConfigured: typeof isConfigured;
    start: typeof start;
};
export {};
//# sourceMappingURL=MyId.d.ts.map