if [ ! -e msrc ]; then
  mkdir msrc
  find src -type f |
    grep '.js$' |
    sed 's/.js$//' |
    xargs -I{} sh -c 'mkdir -p $(dirname msrc/{}.mjs); cp {}.js msrc/{}.mjs'
fi
node --experimental-modules scripts/print-bindings.mjs
rm -rf msrc
