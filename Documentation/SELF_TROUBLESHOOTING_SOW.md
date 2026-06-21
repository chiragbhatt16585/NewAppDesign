# Self Troubleshooting (Fix Your Internet) — Scope of Work

**Module:** Guided self-diagnosis for common internet issues  
**Channels:** User App (and Selfcare Portal when enabled)  
**Pilot reference:** Microscan

---

## Overview

Self Troubleshooting helps subscribers fix common problems (no internet, slow speed, disconnections, Wi‑Fi, website not opening) through guided steps before raising a support ticket. If the issue is not resolved, the app raises a ticket with a summary of what the customer already tried.

Development was done in **two stages** — flows were shared with you first for review; image integration was completed afterward as a separate effort.

**Total turnaround:** **28–35 business days**

---

## How We Delivered (Two Stages)

### Stage 1 — Flows shared in first review (without images)

What you saw in the initial meeting:

- “Fix Your Internet” entry from Help, Tickets, and Settings
- List of issue types (e.g. no internet, slow speed, Wi‑Fi, website not opening)
- Step-by-step questions (Yes / No) and instructions
- Progress through each flow with back navigation
- “Issue resolved” success screen when fixed
- “Raise a ticket” with auto-filled summary when not resolved
- Enable/disable per ISP from backend settings

**Time taken:** ~14–18 business days  
*(Design, backend setup, app flows, first UAT)*

---

### Stage 2 — Image integration (follow-up)

After flow sign-off, we added:

- Step-by-step illustrations (router lights, power, cables, restart, browser steps, etc.)
- Images shown on the correct steps inside each flow
- Layout updates for single and side-by-side images
- Re-testing on Android and iOS with visuals

**Additional time:** ~6–8 business days  
*(Asset export, app updates, config update, second UAT)*

---

## Phase-wise Development Cycle

### Phase 1 – Design & flow planning  
**4–5 business days**

- Support workshop: top complaints and issue types  
- Screen design: hub, steps, success popup, raise ticket  
- Flow paths agreed before build starts  

---

### Phase 2 – Backend & configuration  
**5–7 business days**

- Store troubleshooting flows in CRM (editable without new app release)  
- On/off switch per ISP (`fix_your_internet`)  
- Link each issue type to support ticket category  

---

### Phase 3 – APIs  
**3–4 business days**

- Load flows for logged-in user  
- Create support ticket with self-diagnosis summary when customer escalates  

---

### Phase 4 – User App — flows (Stage 1)  
**5–6 business days**

- Full guided flows in the app  
- Navigation from Help, Tickets, Settings  
- Ticket creation with step summary  
- **Shared with client for review — text only, no images**  

---

### Phase 5 – Images & visual steps (Stage 2)  
**6–8 business days**

- Step illustrations added to flows  
- App layout updated for images  
- Flows updated in CRM with image references  
- Second round of testing on devices  

---

### Phase 6 – Entry points & polish  
**2–3 business days**

- Help / FAQ card  
- Tickets screen shortcut  
- Add Ticket redirects to self-diagnosis when feature is on  

---

### Phase 7 – Testing & UAT  
**5–7 business days** *(two rounds)*

- **Round 1:** All flows and tickets (after Stage 1)  
- **Round 2:** Images and layout (after Stage 2)  
- Sign-off before production go-live  

---

## Effort Summary

| Area | Duration |
|------|----------|
| Design | 4–5 days (+ 2–3 days for image layouts) |
| Backend & CRM | 5–7 days |
| APIs | 3–4 days |
| App — flows only (Stage 1) | 5–6 days |
| App — images (Stage 2) | 3–4 days |
| Content & illustrations | 3–4 days |
| Testing & UAT (both rounds) | 5–7 days |
| Review & go-live buffer | 3–4 days |
| **Total** | **28–35 business days** |

---

## Key Business Impact

- Customers can fix common issues without calling support  
- Fewer incomplete tickets — support sees what was already tried  
- Flows can be updated from backend without a new app build  
- Can be turned on per ISP  
- Normal login, billing, and ticket flows are unchanged when feature is off  

---

## Prerequisites (from client side)

1. Confirmation on which issue types to include and matching ticket categories  
2. Sign-off on **flows and wording** before image work starts  
3. Illustrations / router photos ready for Stage 2 (or approval to use standard set)  
4. Pilot ISP and UAT contact from support team  
5. Backend flag enabled for pilot ISP when going live  

---

## Timeline at a Glance

```
Weeks 1–2   Design · Backend · APIs
Week 3      App flows (Stage 1) · Integration
Week 4      ★ Client review — flows without images · UAT Round 1
Week 4–5    Image integration (Stage 2) · UAT Round 2
Week 5–6    Pilot go-live
```

---

## Sign-off

| Role | Name | Date |
|------|------|------|
| Client / Product Owner | | |
| Development Team | | |
| Support / Operations | | |

---

*Self Troubleshooting — Fix Your Internet · User App module*
