#!/bin/bash
set -euo pipefail
pushd $(dirname "$0")/..

# Check if a profile parameter is provided, default to 'dev' if not
PROFILE=${1:-dev}

export WORLD_ADDRESS=$(cat ./manifests/$PROFILE/manifest.json | jq -r '.world.address')

export ARENA_ADDRESS=$(cat ./manifests/$PROFILE/manifest.json | jq -r '.contracts[] | select(.name == "contracts::systems::arena::arena" ).address')

export ACTIONS_ADDRESS=$(cat ./manifests/$PROFILE/manifest.json | jq -r '.contracts[] | select(.name == "contracts::systems::actions::actions" ).address')




echo "---------------------------------------------------------------------------"
echo world : $WORLD_ADDRESS
echo " "
echo arena : $ARENA_ADDRESS
echo " "
echo actions : $ACTIONS_ADDRESS

echo "---------------------------------------------------------------------------"

echo ">>> Host auth..."
sozo -P $PROFILE auth grant --world $WORLD_ADDRESS --wait writer \
  Game,$ARENA_ADDRESS \
  GameData,$ARENA_ADDRESS \
  Player,$ARENA_ADDRESS \
  Dtank,$ARENA_ADDRESS \
  Tile,$ARENA_ADDRESS \
  Game,$ACTIONS_ADDRESS\
  Tile,$ACTIONS_ADDRESS\
  Dtank,$ACTIONS_ADDRESS\
  Player,$ACTIONS_ADDRESS \



echo "Default authorizations have been successfully set."