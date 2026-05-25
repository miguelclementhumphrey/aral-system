#!/bin/bash
set -e

# Start MongoDB if not already running
if ! pgrep -x mongod > /dev/null; then
  mkdir -p /tmp/mongodb-data /tmp/mongodb-logs
  mongod --dbpath /tmp/mongodb-data --logpath /tmp/mongodb-logs/mongod.log --fork --port 27017
  echo "MongoDB started"
  # Wait for MongoDB to be ready
  for i in {1..15}; do
    if mongosh --quiet --eval "db.runCommand({ ping: 1 })" mongodb://localhost:27017/aral_system > /dev/null 2>&1; then
      echo "MongoDB is ready"
      break
    fi
    echo "Waiting for MongoDB... ($i)"
    sleep 1
  done
else
  echo "MongoDB already running"
fi

# Start the API server
exec node --enable-source-maps ./dist/index.mjs
