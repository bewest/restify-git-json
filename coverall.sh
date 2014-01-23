#!/bin/bash

env $(cat .cover_env) ./node_modules/.bin/coveralls

