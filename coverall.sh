#!/bin/bash

if [[ -f .cover_env ]] ; then
  env
  # env $(cat .cover_env) ./node_modules/.bin/coveralls
  # env $(cat .cover_env) ./node_modules/.bin/coveralls
fi
./node_modules/.bin/coveralls

