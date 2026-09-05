# Website developer handoff — Microscan “Refer a Friend” deep link (SMS campaign)

**To:** Website developer (microscaninternet.com)  
**From:** Mobile app team  
**App:** Microscan Recharge & Support  
**Goal:** When a customer taps the SMS link, open the **Microscan app → Refer a Friend** screen if the app is installed; otherwise show Play Store / App Store download.

---

## 1. Background / problem

SMS template uses this URL:

```text
https://www.microscaninternet.com/download-app
```

Today that page only shows store download buttons. Clicking it opens the **website in the browser**, not the app.

The mobile app **already supports** opening Refer a Friend from:

| Link | Status |
|------|--------|
| `microscan://refer-friend` | Works now (custom scheme) |
| `https://www.microscaninternet.com/download-app` | Needs website work (this document) |
| `https://www.microscaninternet.com/refer-friend` | Needs website work (recommended extra path) |

**The app alone cannot intercept HTTPS SMS links.** Website changes are required.

---

## 2. What we need from the website (choose A + B)

### Option A — Quick fix (do this first, for SMS ASAP)

Update the existing **`/download-app`** page so that on open it:

1. Tries to open the installed app using:
   - Android: Intent URL → `microscan://refer-friend`
   - iOS: `microscan://refer-friend`
2. If the app is not installed (or open fails), after ~1.5 seconds fall back to:
   - Android → Play Store  
   - iOS → App Store  

A ready HTML/JS sample is included in this folder:

```text
pages/download-app.html
```

**Store URLs to use:**

- **Android Play Store**  
  `https://play.google.com/store/apps/details?id=in.spacecom.log2space.client.microscan`

- **iOS App Store**  
  `https://apps.apple.com/us/app/microscan-recharge-support/id1526127574`

**Important for Wix / WordPress / CMS sites:**  
If you cannot replace the full page, inject the same JavaScript into `/download-app` so it runs on page load.

---

### Option B — Proper App Links / Universal Links (recommended long-term)

Also host the verification files below so Android/iOS open the app **directly from HTTPS** (best UX in SMS, WhatsApp, Mail, Safari, Chrome).

#### B1) Android App Links — host this exact file

**Public URL (must work in browser, no login):**

```text
https://www.microscaninternet.com/.well-known/assetlinks.json
```

Also recommend the same for non-www if used:

```text
https://microscaninternet.com/.well-known/assetlinks.json
```

**Requirements:**

- HTTPS only  
- HTTP status **200**  
- **No redirect** to another path  
- Content-Type: `application/json`  
- Publicly readable  

**Exact JSON content** (file also in `.well-known/assetlinks.json`):

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "in.spacecom.log2space.client.microscan",
      "sha256_cert_fingerprints": [
        "/9VS8G2N9CKL8NLTKZmI67F0/KB99NciiEDAMvAqatE=",
        "+sYXRdwJA3hvue3mKpYrOZ9zSPC7b4mbgzJmdZEDO5w="
      ]
    }
  }
]
```

Package name: `in.spacecom.log2space.client.microscan`

---

#### B2) iOS Universal Links — host this file

**Public URLs (host both if possible):**

```text
https://www.microscaninternet.com/.well-known/apple-app-site-association
https://www.microscaninternet.com/apple-app-site-association
```

**Requirements:**

- File name has **no `.json` extension**  
- HTTPS, status **200**, **no redirect**  
- Content-Type: `application/json` (or `application/pkcs7-mime`)  
- Publicly readable  

**JSON content** (file in `.well-known/apple-app-site-association`):

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "NADT67WN3N.com.l2sClient.microscan",
        "paths": [
          "/download-app",
          "/download-app/*",
          "/refer-friend",
          "/refer-friend/*"
        ]
      }
    ]
  }
}
```

Apple Team ID: `NADT67WN3N`  
iOS Bundle ID: `com.l2sClient.microscan`  
Final `appID`: `NADT67WN3N.com.l2sClient.microscan`

> Note: Apple Associated Domains capability is already configured on the app side.  
> Apple Developer portal App ID must also have Associated Domains enabled by the iOS/account admin.

---

## 3. Recommended extra page (optional but clean)

Also create:

```text
https://www.microscaninternet.com/refer-friend
```

Same behavior as `/download-app` (try open app → else store).  
Marketing/SMS can later use either URL.

---

## 4. Expected user flow after website update

| User situation | Expected result |
|----------------|-----------------|
| App installed + logged in | Opens Microscan → **Refer a Friend** page |
| App installed + logged out | Opens Microscan → Login → then **Refer a Friend** |
| App not installed | Store download page (Play / App Store) |

---

## 5. How website developer should verify

### Check files are live

Open in browser (must show JSON, status 200):

1. `https://www.microscaninternet.com/.well-known/assetlinks.json`
2. `https://www.microscaninternet.com/.well-known/apple-app-site-association`

### Check smart page

Open on a phone that has Microscan installed:

```text
https://www.microscaninternet.com/download-app
```

App should try to open. If not installed, store should open in ~1–2 seconds.

### Google verification (Android)

```text
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://www.microscaninternet.com&relation=delegate_permission/common.handle_all_urls
```

Should list the Microscan Android package.

---

## 6. App identifiers (for your records)

| Platform | ID |
|----------|----|
| Android package | `in.spacecom.log2space.client.microscan` |
| iOS bundle ID | `com.l2sClient.microscan` |
| Custom URL scheme | `microscan://` |
| Refer Friend path | `microscan://refer-friend` |
| Website domain | `www.microscaninternet.com` |
| SMS URL (current) | `https://www.microscaninternet.com/download-app` |

---

## 7. Files included in this handoff folder

```text
deeplink/
├── WEBSITE-DEVELOPER-HANDOFF.md   ← this document
├── README.md
├── .well-known/
│   ├── assetlinks.json           ← host on website
│   └── apple-app-site-association ← host on website (Team ID already set)
└── pages/
    └── download-app.html         ← smart landing page sample
```

---

## 8. Priority checklist for website developer

1. [ ] Update `/download-app` with smart open-app + store fallback script (`pages/download-app.html`)
2. [ ] Confirm iOS App Store URL is set:
       `https://apps.apple.com/us/app/microscan-recharge-support/id1526127574`
3. [ ] Host `/.well-known/assetlinks.json` (exact content above)
4. [ ] Host `/.well-known/apple-app-site-association` (Team ID already set: `NADT67WN3N`)
5. [ ] Confirm both `.well-known` URLs open as public JSON (no 301/302, no auth)
6. [ ] Optional: create `/refer-friend` with same smart behavior
7. [ ] Notify mobile team when live so we can retest on Android + iPhone

---

## 9. Contact / questions for mobile team

If needed, mobile team can confirm:

- Retest after website deploy  

Thank you.
