#!/bin/bash

# Freshen schemas in React web project
# Run this from your React project root

set -e

WEB_PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_SCHEMAS_DIR="$WEB_PROJECT_ROOT/../thea-shared-schemas"

echo "🔄 Freshening schemas for React web project..."

# Check if thea-shared-schemas exists
if [ ! -d "$SHARED_SCHEMAS_DIR" ]; then
    echo "❌ Error: thea-shared-schemas directory not found at $SHARED_SCHEMAS_DIR"
    echo "💡 Make sure thea-shared-schemas is in the same parent directory as this project"
    exit 1
fi

# For web, we'll use TypeScript interfaces instead of classes
TARGET_DIR="$WEB_PROJECT_ROOT/src/types/generated"

echo "📦 Generating TypeScript interfaces..."
cd "$SHARED_SCHEMAS_DIR"

# Create target directory
mkdir -p "$TARGET_DIR"

# Generate TypeScript interfaces from JSON schemas
# (We'd need a separate TS generator, but for now just copy the schemas)
echo "📁 Copying JSON schemas for reference..."
cp -r schemas "$TARGET_DIR/"

echo "✅ Schemas freshened! JSON schemas available in: src/types/generated/"
echo ""
echo "💡 For now, you can:"
echo "   1. Use the JSON schemas to manually create TypeScript interfaces"
echo "   2. Or install a tool like 'json-schema-to-typescript' to auto-generate"
echo ""
echo "🔧 Quick setup for auto-generation:"
echo "   npm install -g json-schema-to-typescript"
echo "   json2ts src/types/generated/schemas/user.json > src/types/User.ts"