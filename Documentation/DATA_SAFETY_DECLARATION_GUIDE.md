# Google Play Data Safety – What to Declare (Microscan / ISP App)

Use this to fix the **"Invalid Data safety declaration"** / **"Device or other IDs not declared"** error in Play Console. The app **does** collect and send certain data to your backend; you must declare it.

---

## 1. Data your app collects and transmits (from code)

| Data type | Where used | Sent to | Purpose |
|-----------|------------|---------|--------|
| **Device or other IDs** | `notificationService.ts`, `api.ts` | Your backend (`selfcareAddDeviceInfo`) | Device ID, unique ID, FCM (push) token sent for push notifications and device registration. |
| **Device info** (optional to declare) | Same as above | Your backend | Device brand, model, OS name/version, app version, build number, device name; used for support and device registration. |
| **Account / identifiers** | Login, session | Your backend | Username (and password only at login); used for authentication and API calls. |

Google is flagging **Device or other IDs** because the app sends:

- **FCM token** (Firebase Cloud Messaging token for push)
- **Device identifiers** from `react-native-device-info`: `getDeviceId()`, `getUniqueId()`
- **MAC address** (Android only, when available) for device identification

---

## 2. How to fix in Play Console

1. Open [Google Play Console](https://play.google.com/console) → your app **Microscan Customer App**.
2. Go to **Policy** → **App content** (or **App content** in the left menu).
3. Find **Data safety** and click **Start** or **Manage**.
4. When asked **“Does your app collect or share any of the required user data types?”** → choose **Yes**.

### Data types to add

Add at least this (required to fix “Device or other IDs not declared”):

- **Device or other IDs**
  - **Collected:** Yes  
  - **Shared:** No (only with your backend; say “No” for third parties if you don’t share with others).  
  - **Processed ephemerally:** No (you store/use it for push and device registration).  
  - **Required or optional:** Optional (user can use the app without accepting push; if you make push mandatory, set Required).  
  - **Purpose:** Select **App functionality** (e.g. push notifications, device registration).  
  - **Add a short explanation** (e.g. “Device identifier and push notification token are used to send notifications and to register the device with the user’s account.”).

If you want the form to fully match the code, you can also declare:

- **App or other performance data** (e.g. app version, build number) – if you consider that “collected” for support/analytics.
- **Account info** – if you describe “username” / “email or other identifiers” as account identifiers.

Your **privacy policy** must say that you collect device identifiers and use them for push notifications and device registration; keep the Data safety section consistent with that.

---

## 3. Minimal declaration that fixes the error

- **Data type:** Device or other IDs  
- **Collected:** Yes  
- **Shared with third parties:** No (unless you actually share with e.g. Firebase/Google; Firebase is “first party” for FCM, so often still “No” for third-party sharing).  
- **Purpose:** App functionality (push notifications, device registration).  
- **Optional:** Yes (or Required if push is mandatory).

Save and submit. After the next review, the “Device or other IDs not declared” / “Invalid Data safety declaration” issue for version code 39 should clear, as long as your privacy policy is consistent.

---

## 4. Privacy policy

Ensure your **Privacy policy** URL in Play Console (and in-app) states that the app:

- Collects device identifiers and push notification tokens.
- Uses them to deliver push notifications and to associate the device with the user’s account.
- Sends this data to your servers (and to Firebase/Google for FCM, if applicable).

If you want, we can add a short “Data collection” subsection to your in-app or web privacy page so it matches this declaration word-for-word.
