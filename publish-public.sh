#!/bin/sh
# Publica el código en el repositorio PÚBLICO (github.com/asiernozalortega33-creator/moodtrip)
# como una instantánea del último commit: sin el historial privado y firmada con el email noreply de GitHub,
# para no exponer el email personal. El repositorio privado (explora-mood) sigue siendo el de trabajo.
#   sh publish-public.sh "Mensaje del cambio"
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
PUB="https://github.com/asiernozalortega33-creator/moodtrip.git"
NOREPLY="300157670+asiernozalortega33-creator@users.noreply.github.com"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP" 2>/dev/null || true' EXIT
if git clone -q "$PUB" "$TMP/pub" 2>/dev/null && [ -n "$(git -C "$TMP/pub" rev-parse --verify -q HEAD)" ]; then :; else
  rm -rf "$TMP/pub"; mkdir -p "$TMP/pub"; git -C "$TMP/pub" init -q -b main; git -C "$TMP/pub" remote add origin "$PUB"; fi
find "$TMP/pub" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
git -C "$SRC" archive HEAD | tar -x -C "$TMP/pub"
cd "$TMP/pub"
git add -A
if git -c user.name="asiernozalortega33-creator" -c user.email="$NOREPLY" commit -q -m "${1:-Actualiza MoodTrip}"; then
  git push -q origin HEAD:main && echo "Publicado en $PUB"
else echo "Sin cambios que publicar"; fi
