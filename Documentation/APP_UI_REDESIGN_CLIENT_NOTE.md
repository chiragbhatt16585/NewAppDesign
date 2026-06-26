**Subject:** Mobile App Update — Major UI/UX Redesign Across Key Screens

Dear Team,

We are pleased to inform you that we have completed a **major design and user-experience refresh** of the subscriber mobile app. Compared with the layouts from the early development phase, several core screens have been redesigned to improve clarity, consistency, and ease of use for your customers.

Below is a summary of the main areas updated.

---

### Overview

The app has moved from the initial basic layouts to a **modern, structured, and client-branded experience**. The focus has been on:

- Cleaner visual hierarchy and spacing
- Consistent branding (logo, colours, header) per ISP
- Easier navigation for common tasks (renew, upgrade, support, account)
- Configuration-driven menus so features can be shown or hidden without a new app release

These changes are already reflected in the current app build and differ significantly from the layouts shared in the first phase of development.

---

### 1. Login Screen

The login experience has been redesigned end to end:

- Updated layout with improved logo placement and client-specific branding
- Clearer username/password fields and error messaging
- Support for OTP-based login with improved auto-detection
- Optional biometric login (Face ID / fingerprint) where enabled
- "Remember me" and language selection integrated into a cleaner flow
- Footer links for Contact Us and Support aligned with brand guidelines

**Benefit:** A more professional first impression and a smoother sign-in for subscribers.

---

### 2. Dashboard (Home Screen)

The home/dashboard screen is one of the most heavily updated areas:

- Redesigned **account summary** section (plan, validity, dues, usage)
- Improved **advertisement/banner** carousel
- New **Quick Menu** row with icon-based shortcuts (Account, Sessions, Tickets, Ledger, etc.)
- **Billing information** card with clearer renewal/expiry and payment details
- Profile menu from the header for quick access to account and contact options
- Client-specific styling (e.g. logo in header, background, accent colours)

**Benefit:** Subscribers see the most important information at a glance and can reach key actions in one tap.

---

### 3. Renew Plan — Screen & Flow

The renew journey has been reworked for clarity and reliability:

- Redesigned plan selection and summary screens
- Clear display of plan name, amount, validity, and dues
- Improved payment flow integration (including gateway handling on iOS/Android)
- Configuration-based options (e.g. plan dues, discounts, proforma handling)
- Better confirmation and success/error feedback after payment

**Benefit:** Fewer steps to understand what is being renewed and a more dependable payment experience.

---

### 4. Upgrade Plan — Screen & Flow

The upgrade path follows the same design standards as renew:

- Updated plan listing and comparison layout
- Step-by-step upgrade confirmation
- Integrated payment and plan-change confirmation screens
- Backend-driven visibility (upgrade tab/menu shown only when active for the subscriber)

**Benefit:** Subscribers can upgrade plans with the same familiar, consistent flow as renewal.

---

### 5. Quick Menu — Complete Redesign

The Quick Menu on the home screen has been fully redesigned:

- **Icon + label** layout in a horizontal row (replacing the older grid/basic layout)
- **Dynamic menu items** loaded from backend settings (only active items are shown)
- Per-client icon colours and styling (e.g. Microscan flat icons vs. filled icons for other ISPs)
- Items such as Account, Sessions, Tickets, Billing History (Ledger), and client-specific entries (e.g. Refer a Friend)
- Responsive loading, retry, and empty states

**Benefit:** A modern, app-like shortcut bar that adapts to each ISP's enabled features.

---

### Additional Improvements (Supporting the Above)

Along with these five areas, related screens were aligned to the new design language, including:

- More Options / Menu screen
- Contact Us & Support
- Settings and profile update
- Refer a Friend (where enabled)

---

### Microscan-Only — New Developments

The following features were developed specifically for **Microscan** and are not part of the standard app for other ISPs at this time.

#### 6. Self Diagnosis (Fix Your Internet)

A guided self-troubleshooting module helps subscribers resolve common connectivity issues before contacting support:

- **Help tab** in the bottom navigation (replacing the standard Support tab for Microscan)
- Issue-type hub (e.g. no internet, slow speed, Wi‑Fi, website not opening)
- Step-by-step guided flows with **Yes / No** questions and clear instructions
- **Illustrations** on relevant steps (router lights, cables, restart, browser steps, etc.)
- Progress indicator and back navigation through each flow
- **Issue resolved** success screen when the customer fixes the problem
- **Raise a ticket** with an auto-filled summary of steps already tried when the issue is not resolved
- Entry points from **Help**, **Tickets**, **Settings**, and when creating a new ticket
- Flows are **CRM-driven** (`user_self_diagnosis`) and can be updated from the backend without a new app release
- Feature can be enabled or disabled per ISP from backend settings

**Benefit:** Fewer support calls for common issues, better-informed tickets when escalation is needed, and faster resolution for subscribers.

#### 7. Customer Consent Form

A digital consent screen for new or pending-consent subscribers, shown automatically after login when required by the backend:

- Triggered when the API returns `consent_required` for the subscriber
- Displays **customer information** (name, phone, email, installation address)
- Shows **selected plan details** (plan name, validity, monthly amount, router information)
- **One-time charges** (installation and router charges)
- **KYC details** (ID proof, address proof, document numbers)
- Three mandatory **consent checkboxes** (plan/charges understood, agreement to take service, permission to contact for billing/service)
- **Multilingual support** — English, Hindi, and Marathi (language can be switched on the same screen)
- Proceeds to **Slot Booking** after all consents are accepted

**Benefit:** Paperless, compliant onboarding with clear plan and charge disclosure before service activation.

---

### Comparison with Early Phase

If you compare the **current app** with the **initial git/release layouts**, you will notice substantial changes in spacing, typography, card design, icons, and navigation. These were intentional upgrades to match current mobile app standards and your brand requirements—not minor tweaks.

We recommend a **short UAT walkthrough** on your test accounts covering:

1. Login
2. Home / Dashboard
3. Renew Plan (full payment flow if possible)
4. Upgrade Plan
5. Quick Menu shortcuts
6. **Self Diagnosis** — open Help tab, walk through at least one issue flow (with images), and test “Raise a ticket” if unresolved
7. **Consent Form** — test with a subscriber account flagged for consent; verify all sections, language switch, and proceed to Slot Booking

---

### Next Steps

Please review the updated app on **Android and iOS** (test build / Play Store Internal track as applicable) and share any feedback on:

- Branding (logo, colours, header)
- Wording or labels on any screen
- Menu items you want shown or hidden in Quick Menu

We can schedule a demo call if you would like a guided walkthrough of all redesigned screens.

Thank you for your continued partnership.

Best regards,

[Your Name]  
[Company Name]  
[Contact Details]

---

**Short version (WhatsApp / quick email):**

We have completed a major UI redesign of the subscriber app. Updated areas: **Login**, **Dashboard**, **Renew Plan flow**, **Upgrade Plan flow**, and **Quick Menu**. For **Microscan**, we also added **Self Diagnosis (Fix Your Internet)** and the **Customer Consent Form**. Layouts are significantly improved vs. the early version—cleaner design, better branding, and easier navigation. Please test the latest build and share feedback. Happy to demo on a call.
