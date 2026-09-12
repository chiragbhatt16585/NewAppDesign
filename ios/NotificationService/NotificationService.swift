import UserNotifications

/// CleverTap Notification Service Extension (no CTNotificationService Swift module needed).
/// - Records Push Impressions
/// - Downloads / attaches rich media (image/gif/video/audio) before display
///
/// CleverTap is imported via NotificationService-Bridging-Header.h.
class NotificationService: UNNotificationServiceExtension {
  private var contentHandler: ((UNNotificationContent) -> Void)?
  private var bestAttemptContent: UNMutableNotificationContent?

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler
    bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

    guard let bestAttemptContent else {
      contentHandler(request.content)
      return
    }

    // Raise Push Impressions when the notification is about to be displayed
    CleverTap.sharedInstance()?.recordNotificationViewedEvent(withData: request.content.userInfo)

    guard let mediaURL = Self.mediaURL(from: request.content.userInfo) else {
      contentHandler(bestAttemptContent)
      return
    }

    downloadAttachment(from: mediaURL) { [weak self] attachment in
      if let attachment {
        bestAttemptContent.attachments = [attachment]
      }
      contentHandler(bestAttemptContent)
      self?.contentHandler = nil
      self?.bestAttemptContent = nil
    }
  }

  override func serviceExtensionTimeWillExpire() {
    if let contentHandler, let bestAttemptContent {
      contentHandler(bestAttemptContent)
    }
  }

  // MARK: - Media helpers

  /// CleverTap / rich-push media URL keys used by dashboard & CTNotificationService defaults.
  private static func mediaURL(from userInfo: [AnyHashable: Any]) -> URL? {
    let keys = [
      "ct_mediaUrl",
      "ct_mediaURL",
      "wzrk_bp",
      "wzrk_cid",
      "image",
      "mediaUrl",
      "media_url",
    ]
    for key in keys {
      if let value = userInfo[key] as? String,
         let url = URL(string: value),
         !value.isEmpty {
        return url
      }
    }

    // Nested customExtras / pt_json sometimes carry the image URL
    if let extras = userInfo["customExtras"] as? [String: Any] {
      for key in keys {
        if let value = extras[key] as? String,
           let url = URL(string: value),
           !value.isEmpty {
          return url
        }
      }
    }

    if let ptJson = userInfo["pt_json"] as? String,
       let data = ptJson.data(using: .utf8),
       let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
      for key in ["pt_big_img", "pt_img", "ct_mediaUrl", "wzrk_bp", "image"] {
        if let value = json[key] as? String,
           let url = URL(string: value),
           !value.isEmpty {
          return url
        }
      }
    }

    return nil
  }

  private func downloadAttachment(
    from url: URL,
    completion: @escaping (UNNotificationAttachment?) -> Void
  ) {
    let task = URLSession.shared.downloadTask(with: url) { location, response, error in
      guard let location, error == nil else {
        completion(nil)
        return
      }

      let fileExtension = Self.fileExtension(for: url, response: response)
      let tmpDir = URL(fileURLWithPath: NSTemporaryDirectory())
      let tmpFile = tmpDir.appendingPathComponent(UUID().uuidString + fileExtension)

      do {
        if FileManager.default.fileExists(atPath: tmpFile.path) {
          try FileManager.default.removeItem(at: tmpFile)
        }
        try FileManager.default.moveItem(at: location, to: tmpFile)
        let attachment = try UNNotificationAttachment(
          identifier: "ct_media",
          url: tmpFile,
          options: nil
        )
        completion(attachment)
      } catch {
        completion(nil)
      }
    }
    task.resume()
  }

  private static func fileExtension(for url: URL, response: URLResponse?) -> String {
    let pathExt = url.pathExtension.lowercased()
    if !pathExt.isEmpty {
      return ".\(pathExt)"
    }

    if let mime = response?.mimeType?.lowercased() {
      switch mime {
      case "image/jpeg", "image/jpg": return ".jpg"
      case "image/png": return ".png"
      case "image/gif": return ".gif"
      case "image/webp": return ".webp"
      case "video/mp4": return ".mp4"
      case "audio/mpeg": return ".mp3"
      default: break
      }
    }
    return ".jpg"
  }
}
