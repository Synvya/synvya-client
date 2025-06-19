#!/usr/bin/env bash
# -------------------------------------------------------------
# Build all Lambda function packages for Synvya
#   • Finds every immediate sub‑directory of aws-lambda/ (except lib)
#   • Installs production NPM deps
#   • Bundles each function plus shared lib/ into ZIP files
#   • Writes output to build/lambda-functions/<function>.zip
# -------------------------------------------------------------
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FUNCTION_SRC_DIR="$ROOT_DIR/aws-lambda"
BUILD_DIR="$ROOT_DIR/build/lambda-functions"

echo "🔨 Building Lambda functions..."

mkdir -p "$BUILD_DIR"

for function_path in "$FUNCTION_SRC_DIR"/*/; do
  function_name="$(basename "$function_path")"

  # skip shared lib directory
  if [[ "$function_name" == "lib" ]]; then
    continue
  fi

  echo "📦 Building $function_name ..."

  tmp_dir="$(mktemp -d)"
  trap 'rm -rf "$tmp_dir"' EXIT

  # copy function source (including dotfiles)
  cp -a "$function_path"/. "$tmp_dir/"

  # include shared library
  mkdir -p "$tmp_dir/lib"
  cp -a "$FUNCTION_SRC_DIR/lib"/. "$tmp_dir/lib/"

  # install production-only deps
  (
    cd "$tmp_dir"
    if [[ ! -f package-lock.json ]]; then
      # generate a lockfile so npm ci will succeed
      npm install --package-lock-only --omit=dev
    fi
    npm ci --omit=dev
  )

  # create zip
  zip_path="$BUILD_DIR/$function_name.zip"
  (cd "$tmp_dir" && zip -qr "$zip_path" .)

  echo "✅ Built $function_name → $zip_path"
done

echo "🎉 All Lambda functions built successfully."
#!/usr/bin/env bash
# -------------------------------------------------------------
# Build all Lambda function packages for Synvya
#   • Finds every immediate sub‑directory of aws-lambda/ (except lib)
#   • Installs production NPM deps
#   • Bundles each function plus shared lib/ into ZIP files
#   • Writes output to build/lambda-functions/<function>.zip
# -------------------------------------------------------------
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FUNCTION_SRC_DIR="$ROOT_DIR/aws-lambda"
BUILD_DIR="$ROOT_DIR/build/lambda-functions"

echo "🔨 Building Lambda functions..."

mkdir -p "$BUILD_DIR"

for function_path in "$FUNCTION_SRC_DIR"/*/; do
  function_name="$(basename "$function_path")"

  # Skip shared lib directory
  if [[ "$function_name" == "lib" ]]; then
    continue
  fi

  echo "📦 Building $function_name ..."

  tmp_dir="$(mktemp -d)"
  trap 'rm -rf "$tmp_dir"' EXIT

  # Copy function source (including dot‑files)
  cp -a "$function_path"/. "$tmp_dir/"

  # Include shared library
  mkdir -p "$tmp_dir/lib"
  cp -a "$FUNCTION_SRC_DIR/lib"/. "$tmp_dir/lib/"

  # Install production deps
  (
    cd "$tmp_dir"
    if [[ ! -f package-lock.json ]]; then
      npm install --package-lock-only --omit=dev
    fi
    npm ci --omit=dev
  )

  # Zip
  zip_path="$BUILD_DIR/$function_name.zip"
  (cd "$tmp_dir" && zip -qr "$zip_path" .)

  echo "✅ Built $function_name → $zip_path"
done

echo "🎉 All Lambda functions built successfully."