#!/usr/bin/env sh
set -eu

mkdir -p dist/server dist/client
cp worker.js dist/server/index.js
cp index.html IMG_6206.jpeg Panagiotis_Theodoropoulos_CV.pdf og.png robots.txt sitemap.xml dist/client/
mkdir -p dist/client/assets
cp -R assets/. dist/client/assets/

printf 'Built static site in dist/\n'
