# frozen_string_literal: true

# Manages user configuration stored in .webnotes file at the notes root.
# Provides defaults from ENV variables that can be overridden per-folder.
class Config
  CONFIG_FILE = ".webnotes"

  # All configurable options with their defaults and types
  SCHEMA = {
    # UI Settings
    "theme" => { default: nil, type: :string, env: nil },
    "editor_font" => { default: "cascadia-code", type: :string, env: nil },
    "editor_font_size" => { default: 14, type: :integer, env: nil },
    "preview_zoom" => { default: 100, type: :integer, env: nil },
    "sidebar_visible" => { default: true, type: :boolean, env: nil },
    "typewriter_mode" => { default: false, type: :boolean, env: nil },

    # Paths (ENV defaults)
    "images_path" => { default: nil, type: :string, env: "IMAGES_PATH" },

    # AWS S3 Settings (ENV defaults)
    "aws_access_key_id" => { default: nil, type: :string, env: "AWS_ACCESS_KEY_ID" },
    "aws_secret_access_key" => { default: nil, type: :string, env: "AWS_SECRET_ACCESS_KEY" },
    "aws_s3_bucket" => { default: nil, type: :string, env: "AWS_S3_BUCKET" },
    "aws_region" => { default: nil, type: :string, env: "AWS_REGION" },

    # YouTube API (ENV default)
    "youtube_api_key" => { default: nil, type: :string, env: "YOUTUBE_API_KEY" },

    # Google Custom Search (ENV defaults)
    "google_api_key" => { default: nil, type: :string, env: "GOOGLE_API_KEY" },
    "google_cse_id" => { default: nil, type: :string, env: "GOOGLE_CSE_ID" }
  }.freeze

  # Keys that should not be exposed to the frontend (sensitive)
  SENSITIVE_KEYS = %w[
    aws_access_key_id
    aws_secret_access_key
    youtube_api_key
    google_api_key
  ].freeze

  # Keys that are UI settings (saved from frontend)
  UI_KEYS = %w[
    theme
    editor_font
    editor_font_size
    preview_zoom
    sidebar_visible
    typewriter_mode
  ].freeze

  attr_reader :base_path, :values

  def initialize(base_path: nil)
    @base_path = Pathname.new(base_path || ENV.fetch("NOTES_PATH", Rails.root.join("notes")))
    @values = {}
    load_config
  end

  # Get a configuration value
  def get(key)
    key = key.to_s
    return nil unless SCHEMA.key?(key)

    # Priority: file value > ENV value > default
    if @values.key?(key)
      @values[key]
    elsif SCHEMA[key][:env] && ENV[SCHEMA[key][:env]].present?
      cast_value(ENV[SCHEMA[key][:env]], SCHEMA[key][:type])
    else
      SCHEMA[key][:default]
    end
  end

  # Set a configuration value and save to file
  def set(key, value)
    key = key.to_s
    return false unless SCHEMA.key?(key)

    casted = cast_value(value, SCHEMA[key][:type])
    @values[key] = casted
    save_single_key(key, casted)
    true
  end

  # Update multiple values at once
  def update(new_values)
    changes = {}
    new_values.each do |key, value|
      key = key.to_s
      next unless SCHEMA.key?(key)
      casted = cast_value(value, SCHEMA[key][:type])
      @values[key] = casted
      changes[key] = casted
    end
    save_keys(changes)
    true
  end

  # Get all UI settings (safe for frontend)
  def ui_settings
    UI_KEYS.each_with_object({}) do |key, hash|
      hash[key] = get(key)
    end
  end

  # Get all settings (for internal use, includes resolved ENV values but masks sensitive data)
  def all_settings(include_sensitive: false)
    SCHEMA.keys.each_with_object({}) do |key, hash|
      if SENSITIVE_KEYS.include?(key)
        if include_sensitive
          hash[key] = get(key)
        else
          # Just indicate if configured (for frontend status display)
          hash["#{key}_configured"] = get(key).present?
        end
      else
        hash[key] = get(key)
      end
    end
  end

  # Check if a feature is available (API key configured)
  def feature_available?(feature)
    case feature.to_s
    when "s3_upload"
      get("aws_access_key_id").present? &&
        get("aws_secret_access_key").present? &&
        get("aws_s3_bucket").present?
    when "youtube_search"
      get("youtube_api_key").present?
    when "google_search"
      get("google_api_key").present? && get("google_cse_id").present?
    when "local_images"
      get("images_path").present?
    else
      false
    end
  end

  # Get the effective value for a setting (used by services)
  def effective_value(key)
    get(key)
  end

  # Ensure config file exists with template
  def ensure_config_file
    return if config_file_path.exist?
    create_template_config
  end

  def config_file_path
    @base_path.join(CONFIG_FILE)
  end

  private

  def load_config
    ensure_config_file
    return unless config_file_path.exist?

    content = config_file_path.read
    parse_config(content)
  rescue => e
    Rails.logger.warn("Failed to load .webnotes config: #{e.message}")
    @values = {}
  end

  def parse_config(content)
    @values = {}

    content.each_line do |line|
      line = line.strip

      # Skip empty lines and comments
      next if line.empty? || line.start_with?("#")

      # Parse key = value format (keys can contain letters, numbers, and underscores)
      if line =~ /^([a-z0-9_]+)\s*=\s*(.*)$/i
        key = $1.downcase
        value = $2.strip

        # Remove surrounding quotes if present
        value = value[1..-2] if value.start_with?('"') && value.end_with?('"')
        value = value[1..-2] if value.start_with?("'") && value.end_with?("'")

        # Only accept known keys
        if SCHEMA.key?(key)
          @values[key] = cast_value(value, SCHEMA[key][:type])
        end
      end
    end
  end

  def cast_value(value, type)
    return nil if value.nil? || value.to_s.strip.empty?

    case type
    when :integer
      value.to_i
    when :boolean
      %w[true 1 yes on].include?(value.to_s.downcase)
    when :string
      value.to_s
    else
      value
    end
  end

  # Save a single key to the config file (surgical update)
  def save_single_key(key, value)
    save_keys({ key => value })
  end

  # Save multiple keys to the config file (surgical update)
  # Only modifies the specified keys, preserves everything else exactly as-is
  def save_keys(changes)
    return if changes.empty?

    ensure_config_file

    lines = []
    keys_written = Set.new

    config_file_path.read.each_line do |line|
      stripped = line.strip

      if stripped.empty?
        # Preserve empty lines
        lines << ""
      elsif stripped.start_with?("#")
        # Check if this is a commented-out key we're now setting
        if stripped =~ /^#\s*([a-z0-9_]+)\s*=/i
          key = $1.downcase
          if changes.key?(key) && !keys_written.include?(key)
            # Replace commented line with actual value
            lines << format_value(key, changes[key])
            keys_written.add(key)
            next
          end
        end
        # Preserve comment line as-is
        lines << line.chomp
      elsif stripped =~ /^([a-z0-9_]+)\s*=/i
        key = $1.downcase
        if changes.key?(key)
          # Update this key with new value
          lines << format_value(key, changes[key])
          keys_written.add(key)
        else
          # Preserve line exactly as-is (including original formatting)
          lines << line.chomp
        end
      else
        # Preserve any other line (malformed or unknown)
        lines << line.chomp
      end
    end

    # Append any new keys that weren't in the file
    changes.each do |key, value|
      unless keys_written.include?(key)
        lines << format_value(key, value)
      end
    end

    config_file_path.write(lines.join("\n") + "\n")
  rescue => e
    Rails.logger.error("Failed to save .webnotes config: #{e.message}")
    false
  end

  def format_value(key, value)
    case SCHEMA[key][:type]
    when :string
      if value.to_s.include?(" ") || value.to_s.include?("=")
        "#{key} = \"#{value}\""
      else
        "#{key} = #{value}"
      end
    when :boolean
      "#{key} = #{value ? 'true' : 'false'}"
    else
      "#{key} = #{value}"
    end
  end

  def create_template_config
    lines = generate_template_lines
    config_file_path.write(lines.join("\n") + "\n")
  rescue => e
    Rails.logger.warn("Failed to create .webnotes template: #{e.message}")
  end

  def generate_template_lines
    [
      "# WebNotes Configuration",
      "# Uncomment and modify values as needed.",
      "# Environment variables are used as defaults if not specified here.",
      "",
      "# UI Settings",
      "",
      "# Theme: light, dark, gruvbox, tokyo-night, solarized-dark,",
      "#        solarized-light, nord, cappuccino, osaka, hackerman",
      "# theme = dark",
      "",
      "# Editor font: cascadia-code, jetbrains-mono, fira-code,",
      "#              source-code-pro, ubuntu-mono, roboto-mono, hack",
      "# editor_font = cascadia-code",
      "",
      "# editor_font_size = 14",
      "# preview_zoom = 100",
      "# sidebar_visible = true",
      "# typewriter_mode = false",
      "",
      "# Local Images",
      "",
      "# images_path = /path/to/images",
      "",
      "# AWS S3 (for image uploads)",
      "",
      "# aws_access_key_id = your-access-key",
      "# aws_secret_access_key = your-secret-key",
      "# aws_s3_bucket = your-bucket-name",
      "# aws_region = us-east-1",
      "",
      "# YouTube API (for video search)",
      "",
      "# youtube_api_key = your-youtube-api-key",
      "",
      "# Google Custom Search (for image search)",
      "",
      "# google_api_key = your-google-api-key",
      "# google_cse_id = your-custom-search-engine-id"
    ]
  end

  def generate_config_lines
    lines = generate_template_lines

    # Replace commented lines with actual values where we have them
    @values.each do |key, value|
      pattern = /^# #{key} = /
      index = lines.find_index { |l| l =~ pattern }
      if index
        lines[index] = format_value(key, value)
      else
        lines << format_value(key, value)
      end
    end

    lines
  end
end
