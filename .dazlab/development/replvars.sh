#!/bin/sh

PROJECT_ID=$1
COMMIT_SHA=$2

sed -i "s/\$PROJECT_ID/${PROJECT_ID}/g" .dazlab/development/deployment.yaml
sed -i "s/\$COMMIT_SHA/${COMMIT_SHA}/g" .dazlab/development/deployment.yaml
