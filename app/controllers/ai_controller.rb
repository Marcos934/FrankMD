# frozen_string_literal: true

class AiController < ApplicationController
  skip_forgery_protection only: [ :fix_grammar, :generate_image ]

  # GET /ai/config
  def config
    render json: AiService.provider_info
  end

  # POST /ai/fix_grammar
  def fix_grammar
    text = params[:text].to_s

    if text.blank?
      return render json: { error: "No text provided" }, status: :bad_request
    end

    result = AiService.fix_grammar(text)

    if result[:error]
      render json: { error: result[:error] }, status: :unprocessable_entity
    else
      render json: {
        corrected: result[:corrected],
        provider: result[:provider],
        model: result[:model]
      }
    end
  end

  # GET /ai/image_config
  def image_config
    render json: AiService.image_generation_info
  end

  # POST /ai/generate_image
  def generate_image
    prompt = params[:prompt].to_s
    reference_image_path = params[:reference_image_path].to_s.presence

    if prompt.blank?
      return render json: { error: "No prompt provided" }, status: :bad_request
    end

    result = AiService.generate_image(prompt, reference_image_path: reference_image_path)

    if result[:error]
      render json: { error: result[:error] }, status: :unprocessable_entity
    else
      render json: result
    end
  end
end
