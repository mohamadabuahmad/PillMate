#!/bin/bash
# This script patches jest-expo to work with React 19 and the current Expo setup

SETUP_FILE="node_modules/jest-expo/src/preset/setup.js"

if [ ! -f "$SETUP_FILE" ]; then
  echo "jest-expo setup file not found. Run npm install first."
  exit 1
fi

# Check if already patched
if grep -q "if (mockNativeModules.UIManager)" "$SETUP_FILE"; then
  echo "jest-expo is already patched"
  exit 0
fi

echo "Patching jest-expo setup file..."

# Patch 1: Wrap UIManager property definition in an if check
sed -i.bak '120s/^Object\.keys/if (mockNativeModules.UIManager) { Object.keys/' "$SETUP_FILE"
sed -i '' '129a\
}' "$SETUP_FILE"

# Patch 2: Wrap Refs mock in try-catch
sed -i '' '186s/^\/\/ Mock the `createSnapshotFriendlyRef`/try {\
&/' "$SETUP_FILE"
sed -i '' '197a\
} catch (e) {\
  \/\/ expo-modules-core\/src\/Refs may not be accessible due to package exports\
}' "$SETUP_FILE"

# Patch 3: Wrap web/index.web require in try-catch
sed -i '' '298s/^\/\/ Installs web/try {\
&/' "$SETUP_FILE"
sed -i '' '299a\
require('\''expo-modules-core\/src\/web\/index.web'\'');\
} catch (e) {\
  \/\/ expo-modules-core\/src\/web\/index.web may not be accessible\
}' "$SETUP_FILE"
sed -i '' '/^require.*expo-modules-core.*web.*index\.web/d' "$SETUP_FILE"

echo "jest-expo patched successfully"
