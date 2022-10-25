#!/bin/bash

export NODE_EXTRA_CA_CERTS=./certs/ca.crt

./node --max-old-space-size=2048 server.js