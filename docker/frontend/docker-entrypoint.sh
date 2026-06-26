#!/bin/sh
set -e

PORT="${PORT:-8080}"
API_UPSTREAM="${API_UPSTREAM:-https://bloomdidiapi-production.up.railway.app}"

case "$API_UPSTREAM" in
  http://*|https://*) ;;
  *) API_UPSTREAM="https://${API_UPSTREAM}" ;;
esac

API_HOST="$(printf '%s' "$API_UPSTREAM" | sed -E 's#^https?://([^/]+).*#\1#')"

export PORT API_UPSTREAM API_HOST

rm -f /etc/nginx/conf.d/default.conf
envsubst '${PORT} ${API_UPSTREAM} ${API_HOST}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

nginx -t
exec nginx -g 'daemon off;'
