#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(RNMyId, RCTEventEmitter)

RCT_EXTERN_METHOD(start:(NSString *)sessionId
                  clientHash:(NSString *)clientHash
                  clientHashId:(NSString *)clientHashId
                  environment:(NSString *)environment
                  locale:(NSString *)locale)

RCT_EXTERN_METHOD(isAvailable)

@end
