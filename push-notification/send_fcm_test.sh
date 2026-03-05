#!/usr/bin/env bash

# Simple FCM HTTP v1 test sender for Microscan.
#
# Usage (two options):
#   1) Pass access token as argument:
#        ./send_fcm_test.sh "<FCM_TOKEN>" "<ACCESS_TOKEN>" "Title" "Body"
#   2) Or set env var and omit second arg:
#        export GOOGLE_FCM_ACCESS_TOKEN="ya29...."
#        ./send_fcm_test.sh "<FCM_TOKEN>" "Title" "Body"
#
# Prerequisites:
#   1) PROJECT_ID and ACCESS_TOKEN must match your Firebase project (l2s-microscan)
#   2) ACCESS_TOKEN must be a short‑lived OAuth2 token from a *service account*
#      in the same project, with scope:
#      https://www.googleapis.com/auth/firebase.messaging
#
#   Example:
#     export GOOGLE_FCM_ACCESS_TOKEN="ya29...."
#     ./send_fcm_test.sh "dH5XzJ5oTi2sqk08d85cr8:APA..." "Microscan Test" "Hello from curl"

set -euo pipefail

PROJECT_ID="l2s-microscan"

FCM_TOKEN="${1:-}"
ACCESS_TOKEN_ARG="${2:-}"

# If second argument looks like a token (starts with ya29.), treat it as access token.
if [[ "$ACCESS_TOKEN_ARG" == ya29.* ]]; then
  ACCESS_TOKEN="$ACCESS_TOKEN_ARG"
  TITLE="${3:-Microscan Internet}"
  BODY="${4:-This is a test notification}"
else
  TITLE="${2:-Microscan Internet}"
  BODY="${3:-This is a test notification}"
  ACCESS_TOKEN="${GOOGLE_FCM_ACCESS_TOKEN:-}"
fi

if [ -z "$FCM_TOKEN" ]; then
  echo "Error: FCM token is required."
  echo "Usage:"
  echo "  $0 \"<FCM_TOKEN>\" \"<ACCESS_TOKEN>\" \"Title\" \"Body\""
  echo "or:"
  echo "  GOOGLE_FCM_ACCESS_TOKEN=... $0 \"<FCM_TOKEN>\" \"Title\" \"Body\""
  exit 1
fi

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Error: No access token provided."
  echo "Provide it as second argument or via GOOGLE_FCM_ACCESS_TOKEN env var."
  exit 1
fi

echo "Sending FCM message to token:"
echo "  $FCM_TOKEN"
echo

curl -sS -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  "https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send" \
  -d @- <<EOF
{
  "message": {
    "token": "${FCM_TOKEN}",
    "notification": {
      "title": "${TITLE}",
      "body": "${BODY}"
    },
    "data": {
      "screen": "Notifications",
      "mydata1": "My Value",
      "mydata2": "2"
    },
    "android": {
      "notification": {
        "channel_id": "default-channel",
        "icon": "ic_stat_microscan",
        "color": "#FF6600"
      }
    }
  }
}
EOF

echo
echo "Done."

