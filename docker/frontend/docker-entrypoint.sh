#!/bin/sh
set -eu

PORT="${PORT:-8080}"
API_UPSTREAM="${API_UPSTREAM:-https://bloomdidiapi-production.up.railway.app}"

case "$API_UPSTREAM" in
  http://*|https://*) ;;
  *) API_UPSTREAM="https://${API_UPSTREAM}" ;;
esac

API_HOST="$(printf '%s' "$API_UPSTREAM" | sed -E 's#^https?://([^/]+).*#\1#')"

export PORT API_UPSTREAM API_HOST
envsubst '${PORT} ${API_UPSTREAM} ${API_HOST}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
