require 'rails_helper'

shared_examples_for 'an idv phone errors controller action' do
  describe 'before_actions' do
    it 'includes before_actions from IdvSession' do
      expect(subject).to have_actions(:before, :redirect_if_sp_context_needed)
    end
  end

  context 'the user is authenticated and has not confirmed their phone' do
    let(:user) { create(:user) }

    it 'renders the error' do
      get action

      expect(response).to render_template(template)
    end
  end

  context 'the user is authenticated and has confirmed their phone' do
    let(:user) { create(:user) }
    let(:idv_session_user_phone_confirmation) { true }

    it 'redirects to the review url' do
      get action

      expect(response).to redirect_to(idv_review_url)
    end
  end

  context 'the user is not authenticated and not recovering their account' do
    it 'redirects to sign in' do
      get action

      expect(response).to redirect_to(new_user_session_url)
    end
  end
end

describe Idv::PhoneErrorsController do
  let(:idv_session) { double }
  let(:idv_session_user_phone_confirmation) { false }
  let(:user) { nil }

  before do
    allow(idv_session).to receive(:user_phone_confirmation).
      and_return(idv_session_user_phone_confirmation)
    allow(idv_session).to receive(:current_user).and_return(user)
    allow(subject).to receive(:remaining_step_attempts).and_return(5)
    allow(controller).to receive(:idv_session).and_return(idv_session)
    stub_sign_in(user) if user
  end

  describe '#warning' do
    let(:action) { :warning }
    let(:template) { 'idv/phone_errors/warning' }

    it_behaves_like 'an idv phone errors controller action'

    context 'with throttle attempts' do
      let(:user) { create(:user) }

      before do
        create(:throttle, user: user, throttle_type: :proof_address, attempts: 1)
      end

      it 'assigns remaining count' do
        get action

        expect(assigns(:remaining_step_attempts)).to be_kind_of(Numeric)
      end
    end
  end

  describe '#jobfail' do
    let(:action) { :jobfail }
    let(:template) { 'idv/phone_errors/jobfail' }

    it_behaves_like 'an idv phone errors controller action'

    context 'with throttle attempts' do
      let(:user) { create(:user) }

      before do
        create(:throttle, user: user, throttle_type: :proof_address, attempts: 1)
      end

      it 'assigns remaining count' do
        get action

        expect(assigns(:remaining_step_attempts)).to be_kind_of(Numeric)
      end
    end
  end

  describe '#failure' do
    let(:action) { :failure }
    let(:template) { 'idv/phone_errors/failure' }

    it_behaves_like 'an idv phone errors controller action'

    context 'while throttled' do
      let(:user) { create(:user) }

      before do
        create(:throttle, :with_throttled, user: user, throttle_type: :proof_address)
      end

      it 'assigns expiration time' do
        get action

        expect(assigns(:expires_at)).to be_kind_of(Time)
      end
    end
  end
end
