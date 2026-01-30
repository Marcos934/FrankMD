# frozen_string_literal: true

require "test_helper"

class ConfigTest < ActiveSupport::TestCase
  def setup
    @test_dir = Rails.root.join("tmp", "test_config_#{SecureRandom.hex(4)}")
    FileUtils.mkdir_p(@test_dir)
    @original_notes_path = ENV["NOTES_PATH"]
    ENV["NOTES_PATH"] = @test_dir.to_s
  end

  def teardown
    FileUtils.rm_rf(@test_dir) if @test_dir&.exist?
    ENV["NOTES_PATH"] = @original_notes_path
  end

  # === Initialization ===

  test "creates config file on initialization if it does not exist" do
    config = Config.new(base_path: @test_dir)

    assert @test_dir.join(".webnotes").exist?
  end

  test "config file template contains all sections" do
    config = Config.new(base_path: @test_dir)
    content = @test_dir.join(".webnotes").read

    assert_includes content, "# UI Settings"
    assert_includes content, "# theme ="
    assert_includes content, "# editor_font ="
    assert_includes content, "# AWS S3"
    assert_includes content, "# YouTube API"
    assert_includes content, "# Google Custom Search"
  end

  # === Default Values ===

  test "returns default values when nothing is configured" do
    config = Config.new(base_path: @test_dir)

    assert_equal "cascadia-code", config.get(:editor_font)
    assert_equal 14, config.get(:editor_font_size)
    assert_equal 100, config.get(:preview_zoom)
    assert_equal true, config.get(:sidebar_visible)
    assert_equal false, config.get(:typewriter_mode)
    assert_nil config.get(:theme)
  end

  # === Reading from File ===

  test "reads values from config file" do
    @test_dir.join(".webnotes").write(<<~CONFIG)
      theme = gruvbox
      editor_font = fira-code
      editor_font_size = 16
    CONFIG

    config = Config.new(base_path: @test_dir)

    assert_equal "gruvbox", config.get(:theme)
    assert_equal "fira-code", config.get(:editor_font)
    assert_equal 16, config.get(:editor_font_size)
  end

  test "reads boolean values correctly" do
    @test_dir.join(".webnotes").write(<<~CONFIG)
      typewriter_mode = true
      sidebar_visible = false
    CONFIG

    config = Config.new(base_path: @test_dir)

    assert_equal true, config.get(:typewriter_mode)
    assert_equal false, config.get(:sidebar_visible)
  end

  test "handles quoted string values" do
    @test_dir.join(".webnotes").write(<<~CONFIG)
      theme = "tokyo-night"
      editor_font = 'jetbrains-mono'
    CONFIG

    config = Config.new(base_path: @test_dir)

    assert_equal "tokyo-night", config.get(:theme)
    assert_equal "jetbrains-mono", config.get(:editor_font)
  end

  test "ignores comments" do
    @test_dir.join(".webnotes").write(<<~CONFIG)
      # This is a comment
      theme = dark
      # editor_font = should-be-ignored
    CONFIG

    config = Config.new(base_path: @test_dir)

    assert_equal "dark", config.get(:theme)
    assert_equal "cascadia-code", config.get(:editor_font) # default
  end

  test "ignores unknown keys" do
    @test_dir.join(".webnotes").write(<<~CONFIG)
      unknown_key = some_value
      theme = light
    CONFIG

    config = Config.new(base_path: @test_dir)

    assert_nil config.get(:unknown_key)
    assert_equal "light", config.get(:theme)
  end

  # === ENV Fallback ===

  test "falls back to ENV for keys with ENV mapping" do
    ENV["YOUTUBE_API_KEY"] = "test-youtube-key"

    config = Config.new(base_path: @test_dir)

    assert_equal "test-youtube-key", config.get(:youtube_api_key)
  ensure
    ENV.delete("YOUTUBE_API_KEY")
  end

  test "file value overrides ENV value" do
    ENV["YOUTUBE_API_KEY"] = "env-key"
    @test_dir.join(".webnotes").write(<<~CONFIG)
      youtube_api_key = file-key
    CONFIG

    config = Config.new(base_path: @test_dir)

    assert_equal "file-key", config.get(:youtube_api_key)
  ensure
    ENV.delete("YOUTUBE_API_KEY")
  end

  # === Writing Values ===

  test "set saves a single value" do
    config = Config.new(base_path: @test_dir)

    config.set(:theme, "gruvbox")

    # Re-read config to verify persistence
    config2 = Config.new(base_path: @test_dir)
    assert_equal "gruvbox", config2.get(:theme)
  end

  test "update saves multiple values" do
    config = Config.new(base_path: @test_dir)

    config.update(theme: "dark", editor_font_size: 18)

    config2 = Config.new(base_path: @test_dir)
    assert_equal "dark", config2.get(:theme)
    assert_equal 18, config2.get(:editor_font_size)
  end

  test "update replaces commented line with actual value" do
    config = Config.new(base_path: @test_dir)
    original_content = @test_dir.join(".webnotes").read
    assert_includes original_content, "# theme ="

    config.set(:theme, "nord")

    new_content = @test_dir.join(".webnotes").read
    assert_includes new_content, "theme = nord"
    refute_includes new_content, "# theme = nord"
  end

  test "update does not duplicate keys" do
    config = Config.new(base_path: @test_dir)
    config.set(:theme, "dark")
    config.set(:theme, "light")
    config.set(:theme, "gruvbox")

    content = @test_dir.join(".webnotes").read
    matches = content.scan(/^theme = /)
    assert_equal 1, matches.length
  end

  test "preserves user-customized file structure when updating" do
    # User has stripped all comments and reordered settings
    @test_dir.join(".webnotes").write(<<~CONFIG)
      editor_font = hack
      theme = dark
      editor_font_size = 16
    CONFIG

    config = Config.new(base_path: @test_dir)
    config.set(:theme, "gruvbox")

    content = @test_dir.join(".webnotes").read
    lines = content.lines.map(&:strip).reject(&:empty?)

    # Should preserve user's ordering and have no comments
    assert_equal 3, lines.length
    assert_equal "editor_font = hack", lines[0]
    assert_equal "theme = gruvbox", lines[1]
    assert_equal "editor_font_size = 16", lines[2]
  end

  test "does not re-add values user manually removed" do
    # Start with full config
    @test_dir.join(".webnotes").write(<<~CONFIG)
      theme = dark
      editor_font = hack
      editor_font_size = 18
    CONFIG

    # Load config (all values are in @values)
    config = Config.new(base_path: @test_dir)
    assert_equal "dark", config.get(:theme)
    assert_equal "hack", config.get(:editor_font)
    assert_equal 18, config.get(:editor_font_size)

    # User manually removes editor_font from file
    @test_dir.join(".webnotes").write(<<~CONFIG)
      theme = dark
      editor_font_size = 18
    CONFIG

    # Create new config and change theme
    config2 = Config.new(base_path: @test_dir)
    config2.set(:theme, "nord")

    # editor_font should NOT be re-added (but editor_font_size should remain)
    content = @test_dir.join(".webnotes").read
    refute_includes content, "editor_font = hack"
    refute_includes content, "editor_font = cascadia"
    assert_includes content, "theme = nord"
    assert_includes content, "editor_font_size = 18"
  end

  test "only modifies the specific key being changed" do
    original_content = <<~CONFIG
      # My custom comment
      theme = dark

      # Another section
      editor_font = fira-code
      editor_font_size = 20
    CONFIG
    @test_dir.join(".webnotes").write(original_content)

    config = Config.new(base_path: @test_dir)
    config.set(:editor_font_size, 22)

    content = @test_dir.join(".webnotes").read

    # Comments and structure preserved
    assert_includes content, "# My custom comment"
    assert_includes content, "# Another section"
    # Other values unchanged
    assert_includes content, "theme = dark"
    assert_includes content, "editor_font = fira-code"
    # Only the target key changed
    assert_includes content, "editor_font_size = 22"
    refute_includes content, "editor_font_size = 20"
  end

  test "appends new key at end if not present in file" do
    @test_dir.join(".webnotes").write(<<~CONFIG)
      theme = dark
    CONFIG

    config = Config.new(base_path: @test_dir)
    config.set(:editor_font, "hack")

    content = @test_dir.join(".webnotes").read
    lines = content.lines.map(&:strip).reject(&:empty?)

    assert_equal "theme = dark", lines[0]
    assert_equal "editor_font = hack", lines[1]
  end

  # === UI Settings ===

  test "ui_settings returns only UI keys" do
    @test_dir.join(".webnotes").write(<<~CONFIG)
      theme = dark
      editor_font = hack
      youtube_api_key = secret
    CONFIG

    config = Config.new(base_path: @test_dir)
    settings = config.ui_settings

    assert_equal "dark", settings["theme"]
    assert_equal "hack", settings["editor_font"]
    refute settings.key?("youtube_api_key")
  end

  # === Feature Detection ===

  test "feature_available? detects S3 configuration" do
    config = Config.new(base_path: @test_dir)
    refute config.feature_available?(:s3_upload)

    @test_dir.join(".webnotes").write(<<~CONFIG)
      aws_access_key_id = key
      aws_secret_access_key = secret
      aws_s3_bucket = bucket
    CONFIG

    config2 = Config.new(base_path: @test_dir)
    assert config2.feature_available?(:s3_upload)
  end

  test "feature_available? detects YouTube configuration" do
    config = Config.new(base_path: @test_dir)
    refute config.feature_available?(:youtube_search)

    @test_dir.join(".webnotes").write(<<~CONFIG)
      youtube_api_key = test-key
    CONFIG

    config2 = Config.new(base_path: @test_dir)
    assert config2.feature_available?(:youtube_search)
  end

  test "feature_available? detects Google search configuration" do
    config = Config.new(base_path: @test_dir)
    refute config.feature_available?(:google_search)

    @test_dir.join(".webnotes").write(<<~CONFIG)
      google_api_key = api-key
      google_cse_id = cse-id
    CONFIG

    config2 = Config.new(base_path: @test_dir)
    assert config2.feature_available?(:google_search)
  end

  # === Corrupted File Handling ===

  test "handles empty config file gracefully" do
    @test_dir.join(".webnotes").write("")

    config = Config.new(base_path: @test_dir)

    assert_equal "cascadia-code", config.get(:editor_font)
  end

  test "handles malformed lines gracefully" do
    @test_dir.join(".webnotes").write(<<~CONFIG)
      this is not valid
      = no key
      theme = dark
      editor_font_size not an int
    CONFIG

    config = Config.new(base_path: @test_dir)

    # Should still parse valid lines
    assert_equal "dark", config.get(:theme)
    # Invalid lines are ignored, default is used
    assert_equal 14, config.get(:editor_font_size)
  end

  test "handles binary garbage in file" do
    @test_dir.join(".webnotes").binwrite("\x00\xFF\xFE\x00theme = dark\n")

    # Should not crash
    config = Config.new(base_path: @test_dir)

    # May or may not parse correctly, but should not crash
    assert_nothing_raised { config.get(:theme) }
  end

  test "handles file read errors gracefully" do
    # Create directory instead of file to cause read error
    FileUtils.rm_f(@test_dir.join(".webnotes"))
    FileUtils.mkdir_p(@test_dir.join(".webnotes"))

    # Should not crash, should use defaults
    config = Config.new(base_path: @test_dir)
    assert_equal "cascadia-code", config.get(:editor_font)
  ensure
    FileUtils.rm_rf(@test_dir.join(".webnotes"))
  end

  # === Type Casting ===

  test "casts integer values" do
    @test_dir.join(".webnotes").write("editor_font_size = 20")

    config = Config.new(base_path: @test_dir)

    assert_equal 20, config.get(:editor_font_size)
    assert_kind_of Integer, config.get(:editor_font_size)
  end

  test "casts boolean true values" do
    ["true", "1", "yes", "on", "TRUE", "Yes"].each do |value|
      @test_dir.join(".webnotes").write("typewriter_mode = #{value}")
      config = Config.new(base_path: @test_dir)
      assert_equal true, config.get(:typewriter_mode), "Expected '#{value}' to be true"
    end
  end

  test "casts boolean false values" do
    ["false", "0", "no", "off", "FALSE", "anything"].each do |value|
      @test_dir.join(".webnotes").write("typewriter_mode = #{value}")
      config = Config.new(base_path: @test_dir)
      assert_equal false, config.get(:typewriter_mode), "Expected '#{value}' to be false"
    end
  end
end
