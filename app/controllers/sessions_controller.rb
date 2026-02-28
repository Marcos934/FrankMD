class SessionsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:new, :create]
  layout false

  def new
  end

  def create
    password = ENV["APP_PASSWORD"]
    
    if password.blank? || params[:password] == password
      session[:authenticated] = true
      redirect_to root_path
    else
      flash.now[:alert] = "Senha incorreta"
      render :new, status: :unauthorized
    end
  end

  def destroy
    session[:authenticated] = nil
    redirect_to login_path, notice: "Logout realizado com sucesso"
  end
end
