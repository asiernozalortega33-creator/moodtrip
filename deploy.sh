#!/bin/sh
# Despliega a producción desde una copia limpia SIN .git.
# Motivo: con el .git presente, el CLI de Vercel adjunta metadatos de git
# y los builds de esta cuenta se quedan colgados en cola (estado UNKNOWN).
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp -r "$SRC/index.html" "$SRC/css" "$SRC/js" "$SRC/api" "$SRC/.vercel" "$SRC/.gitignore" "$SRC/vercel.json" "$TMP/"
cd "$TMP"
vercel deploy . --prod --yes
