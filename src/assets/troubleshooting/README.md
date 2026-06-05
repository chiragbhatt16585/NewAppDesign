# Troubleshooting step images

Bundled PNGs for **Fix Your Internet** flows.  
Source export: `Downloads/Self Diagnosis - Microscan Recharge & Support`.

Register each key in `src/config/troubleshooting-image-map.ts`, then reference in the CRM runtime config (`user_self_diagnosis` via API):

```json
"images": ["router-lights"]
```

| Asset file | JSON key |
|------------|----------|
| router-lights.png | `router-lights` |
| power-setup.png | `power-setup` |
| wan-lights.png | `wan-lights` |
| restart-router-30secs.png | `restart-router-30secs` |
| restart-router-2mins.png | `restart-router-2mins` |
| check-cables.png | `check-cables` |
| slow-connected-devices.png | `slow-connected-devices` |
| disconnect-connect.png | `disconnect-connect` |
| website-try-browser.png | `website-try-browser` |
| website-clear-data.png | `website-clear-data` |
| website-incognito.png | `website-incognito` |
| website-mobile-internet.png | `website-mobile-internet` |
| website-final-step.png | `website-final-step` |

For remote images (CDN), use `imageUrls` instead of `images`.
