# frozen_string_literal: true

# Images path fallback: set IMAGES_PATH from XDG/Pictures if not already set.
# This runs once at boot so Config.get("images_path") picks it up via ENV fallback.
# The Config class (.fed file) takes priority over this ENV value.
unless ENV["IMAGES_PATH"]
  fallback = ENV["XDG_PICTURES_DIR"]
  fallback ||= File.expand_path("~/Pictures") if File.directory?(File.expand_path("~/Pictures"))
  ENV["IMAGES_PATH"] = fallback if fallback
end
