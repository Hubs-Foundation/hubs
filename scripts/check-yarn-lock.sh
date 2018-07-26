#!/usr/bin/env bash

if [ `git diff '**/yarn.lock' | wc -l` -ne 0 ]; then
  echo ""
  tput setaf 1
  echo "!! UNCOMMITED YARN.LOCK CHANGES !!"
  tput sgr0
  echo ""
  exit 1
fi
