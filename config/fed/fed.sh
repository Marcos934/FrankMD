# FrankMD shell functions
# Source this file in your ~/.bashrc or ~/.zshrc:
#   source ~/.config/frankmd/fed.sh

# Default browser (override with FRANKMD_BROWSER)
: "${FRANKMD_BROWSER:=brave}"

# Open FrankMD with a notes directory
fed() {
  local notes="$(realpath "${1:-.}")"
  local splash="$HOME/.config/frankmd/splash.html"

  # Ensure container is running with correct notes path
  if docker ps -q -f name=frankmd 2>/dev/null | grep -q .; then
    local current
    current=$(docker inspect frankmd --format '{{range .Mounts}}{{if eq .Destination "/rails/notes"}}{{.Source}}{{end}}{{end}}' 2>/dev/null)
    [[ "$current" != "$notes" ]] && docker stop frankmd >/dev/null 2>&1
  fi

  # Start container if not running
  if ! docker ps -q -f name=frankmd 2>/dev/null | grep -q .; then
    docker rm frankmd 2>/dev/null

    # Forward host env vars if set (Config .fed file still overrides these)
    local env_flags=()
    local env_vars=(
      AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_S3_BUCKET AWS_REGION
      YOUTUBE_API_KEY
      GOOGLE_API_KEY GOOGLE_CSE_ID
      AI_PROVIDER AI_MODEL
      OLLAMA_API_BASE OLLAMA_MODEL
      OPENROUTER_API_KEY OPENROUTER_MODEL
      ANTHROPIC_API_KEY ANTHROPIC_MODEL
      GEMINI_API_KEY GEMINI_MODEL
      OPENAI_API_KEY OPENAI_MODEL
      IMAGE_GENERATION_MODEL
      FRANKMD_LOCALE
    )
    for var in "${env_vars[@]}"; do
      if printenv "$var" >/dev/null 2>&1; then
        env_flags+=(-e "$var=$(printenv "$var")")
      fi
    done

    # Detect images directory to mount into container
    # Check: IMAGES_PATH env > .fed file > XDG_PICTURES_DIR > ~/Pictures
    local images_dir="${IMAGES_PATH:-}"
    if [[ -z "$images_dir" && -f "$notes/.fed" ]]; then
      images_dir=$(grep -m1 '^images_path\s*=' "$notes/.fed" | sed 's/^[^=]*=\s*//' | sed 's/^["'\'']\|["'\'']\s*$//g')
      images_dir="${images_dir/#\~/$HOME}"
    fi
    if [[ -z "$images_dir" ]]; then
      images_dir="${XDG_PICTURES_DIR:-}"
    fi
    if [[ -z "$images_dir" && -d "$HOME/Pictures" ]]; then
      images_dir="$HOME/Pictures"
    fi

    # Mount images directory into container at a fixed path (read-only)
    local images_mount=()
    if [[ -n "$images_dir" && -d "$images_dir" ]]; then
      images_dir="$(realpath "$images_dir")"
      images_mount=(--mount "type=bind,source=$images_dir,target=/data/images,readonly")
      # Override IMAGES_PATH inside container to match the mount point
      env_flags+=(-e "IMAGES_PATH=/data/images")
      echo "[fed] Mounting images: $images_dir -> /data/images"
    else
      echo "[fed] Warning: no images directory found (IMAGES_PATH not set, no ~/Pictures)"
    fi

    docker run -d --name frankmd --rm \
      -p 7591:80 \
      --user "$(id -u):$(id -g)" \
      -v "$notes:/rails/notes" \
      "${images_mount[@]}" \
      "${env_flags[@]}" \
      ${FRANKMD_ENV:+--env-file "$FRANKMD_ENV"} \
      akitaonrails/frankmd:latest >/dev/null
  fi

  # Open browser with splash (polls until Rails is ready)
  "$FRANKMD_BROWSER" --app="file://$splash"
}

# Update FrankMD Docker image
fed-update() {
  echo "Checking for updates..."
  local old_digest new_digest
  old_digest=$(docker images --digests --format "{{.Digest}}" akitaonrails/frankmd:latest 2>/dev/null | head -1)
  docker pull akitaonrails/frankmd:latest
  new_digest=$(docker images --digests --format "{{.Digest}}" akitaonrails/frankmd:latest 2>/dev/null | head -1)

  if [[ "$old_digest" != "$new_digest" ]]; then
    echo "Updated! Restart FrankMD to use new version."
    docker stop frankmd 2>/dev/null
  else
    echo "Already up to date."
  fi
}

# Stop FrankMD
fed-stop() {
  docker stop frankmd 2>/dev/null && echo "Stopped." || echo "Not running."
}
