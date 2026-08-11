#!/usr/bin/env sh
set -eu

mkdir -p dist/server dist/client
cp worker.js dist/server/index.js
cp index.html IMG_6206.jpeg MyCV.pdf og.png dist/client/

printf 'Built static site in dist/\n'
