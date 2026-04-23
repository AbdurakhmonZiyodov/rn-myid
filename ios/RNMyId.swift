import Foundation
import React
import MyIdSDK

@objc(RNMyId)
class RNMyId: RCTEventEmitter {

  private var hasListeners = false

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func supportedEvents() -> [String]! {
    return ["onSuccess", "onError", "onUserExited"]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc(start:clientHash:clientHashId:environment:locale:)
  func start(
    _ sessionId: String,
    clientHash: String,
    clientHashId: String,
    environment: String,
    locale: String
  ) {
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
      let config = MyIdConfig()
      config.sessionId = sessionId
      config.clientHash = clientHash
      config.clientHashId = clientHashId
      config.locale = self.mapLocale(locale)
      config.environment = environment.uppercased() == "PRODUCTION" ? .production : .debug
      config.entryType = .identification

      MyIdClient.start(withConfig: config, withDelegate: self)
    }
  }

  private func mapLocale(_ locale: String) -> MyIdLocale {
    switch locale.lowercased() {
    case "ru": return .russian
    case "en": return .english
    case "uz-cyrl", "cyrl":
      // Fallback to uzbek latin if SDK has no cyrillic case exposed under this name.
      // Adjust here if the SDK exposes a dedicated cyrillic enum in a future version.
      return .uzbek
    default:
      return .uzbek
    }
  }

  private func sendIfListening(_ name: String, body: Any) {
    guard hasListeners else { return }
    sendEvent(withName: name, body: body)
  }
}

extension RNMyId: MyIdClientDelegate {
  func onSuccess(result: MyIdSDK.MyIdResult) {
    var body: [String: Any] = ["code": result.code]
    if let image = result.image,
       let data = image.jpegData(compressionQuality: 1) {
      body["image"] = data.base64EncodedString(options: .lineLength64Characters)
    }
    sendIfListening("onSuccess", body: body)
  }

  func onError(exception: MyIdSDK.MyIdException) {
    sendIfListening("onError", body: [
      "message": exception.message,
      "code": exception.code
    ])
  }

  func onUserExited() {
    sendIfListening("onUserExited", body: ["message": "exited"])
  }

  func onEvent(event: MyIdEvent) {
    // Intentionally unused at the JS layer; keeping the delegate method satisfied.
  }
}
