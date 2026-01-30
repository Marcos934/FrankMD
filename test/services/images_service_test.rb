# frozen_string_literal: true

require "test_helper"

class ImagesServiceTest < ActiveSupport::TestCase
  def setup
    # Store original config
    @original_config = {
      path: Rails.application.config.webnotes_images.path,
      enabled: Rails.application.config.webnotes_images.enabled
    }

    # Create temp directory for images
    @temp_dir = Rails.root.join("tmp", "test_images_#{SecureRandom.hex(8)}")
    FileUtils.mkdir_p(@temp_dir)

    # Configure images path
    Rails.application.config.webnotes_images.path = @temp_dir.to_s
    Rails.application.config.webnotes_images.enabled = true

    # Clear memoized path
    ImagesService.instance_variable_set(:@images_path, nil)
  end

  def teardown
    FileUtils.rm_rf(@temp_dir) if @temp_dir&.exist?

    # Restore original config
    if @original_config
      Rails.application.config.webnotes_images.path = @original_config[:path]
      Rails.application.config.webnotes_images.enabled = @original_config[:enabled]
    end

    ImagesService.instance_variable_set(:@images_path, nil)
  end

  def create_test_image(name, content = "fake image data")
    path = @temp_dir.join(name)
    FileUtils.mkdir_p(path.dirname)
    File.write(path, content)
    # Set mtime to control ordering
    FileUtils.touch(path, mtime: Time.now)
    path
  end

  # === enabled? ===

  test "enabled? returns true when path is set" do
    assert ImagesService.enabled?
  end

  test "enabled? returns false when path is not set" do
    Rails.application.config.webnotes_images.enabled = false
    refute ImagesService.enabled?
  end

  # === list ===

  test "list returns empty array when disabled" do
    Rails.application.config.webnotes_images.enabled = false
    assert_equal [], ImagesService.list
  end

  test "list returns empty array when directory doesn't exist" do
    FileUtils.rm_rf(@temp_dir)
    assert_equal [], ImagesService.list
  end

  test "list returns images sorted by most recent" do
    # Create images with different mtimes
    img1 = create_test_image("old.jpg")
    sleep 0.01
    img2 = create_test_image("new.jpg")

    images = ImagesService.list
    assert_equal 2, images.length
    assert_equal "new.jpg", images[0][:name]
    assert_equal "old.jpg", images[1][:name]
  end

  test "list only returns supported image extensions" do
    create_test_image("image.jpg")
    create_test_image("image.png")
    create_test_image("image.gif")
    create_test_image("document.txt")
    create_test_image("script.js")

    images = ImagesService.list
    names = images.map { |i| i[:name] }

    assert_includes names, "image.jpg"
    assert_includes names, "image.png"
    assert_includes names, "image.gif"
    refute_includes names, "document.txt"
    refute_includes names, "script.js"
  end

  test "list limits to 10 results" do
    15.times { |i| create_test_image("image_#{i}.jpg") }

    images = ImagesService.list
    assert_equal 10, images.length
  end

  test "list filters by search term" do
    create_test_image("cat.jpg")
    create_test_image("dog.png")
    create_test_image("category.gif")

    images = ImagesService.list(search: "cat")
    names = images.map { |i| i[:name] }

    assert_includes names, "cat.jpg"
    assert_includes names, "category.gif"
    refute_includes names, "dog.png"
  end

  test "list search is case insensitive" do
    create_test_image("MyPhoto.JPG")

    images = ImagesService.list(search: "myphoto")
    assert_equal 1, images.length
    assert_equal "MyPhoto.JPG", images[0][:name]
  end

  test "list includes images in subdirectories" do
    create_test_image("root.jpg")
    create_test_image("subfolder/nested.png")

    images = ImagesService.list
    paths = images.map { |i| i[:path] }

    assert_includes paths, "root.jpg"
    assert_includes paths, "subfolder/nested.png"
  end

  # === find_image ===

  test "find_image returns full path for existing image" do
    create_test_image("test.jpg")

    result = ImagesService.find_image("test.jpg")
    assert_equal @temp_dir.join("test.jpg"), result
  end

  test "find_image returns nil for non-existent image" do
    result = ImagesService.find_image("nonexistent.jpg")
    assert_nil result
  end

  test "find_image prevents path traversal" do
    result = ImagesService.find_image("../../../etc/passwd")
    assert_nil result
  end

  test "find_image works with subdirectories" do
    create_test_image("photos/vacation.jpg")

    result = ImagesService.find_image("photos/vacation.jpg")
    assert_equal @temp_dir.join("photos/vacation.jpg"), result
  end

  # === upload_base64_data ===

  test "upload_base64_data saves base64 image to notes directory" do
    # 1x1 PNG image
    png_data = [
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
      0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xFE, 0xD4, 0xE7, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ].pack("C*")
    base64_data = Base64.strict_encode64(png_data)

    result = ImagesService.upload_base64_data(base64_data, mime_type: "image/png", filename: "test_ai.png")

    assert result[:url]
    assert result[:url].start_with?("images/")
    assert result[:url].include?("test_ai")

    # Clean up
    notes_path = Pathname.new(ENV.fetch("NOTES_PATH", Rails.root.join("notes")))
    FileUtils.rm_f(notes_path.join(result[:url]))
  end

  test "upload_base64_data returns error for invalid base64" do
    result = ImagesService.upload_base64_data("not valid base64!!!", mime_type: "image/png")
    assert result[:error]
    assert_includes result[:error], "Invalid base64"
  end

  test "upload_base64_data generates filename when not provided" do
    png_data = [
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
      0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xFE, 0xD4, 0xE7, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ].pack("C*")
    base64_data = Base64.strict_encode64(png_data)

    result = ImagesService.upload_base64_data(base64_data, mime_type: "image/png")

    assert result[:url]
    assert result[:url].include?("ai_generated_")

    # Clean up
    notes_path = Pathname.new(ENV.fetch("NOTES_PATH", Rails.root.join("notes")))
    FileUtils.rm_f(notes_path.join(result[:url]))
  end
end
