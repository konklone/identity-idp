module Px
  module Steps
    class WelcomeStep < Px::Steps::DocAuthBaseStep
      def call; end

      def form_submit
        Idv::ConsentForm.new.submit(consent_form_params)
      end

      def consent_form_params
        params.permit(:ial2_consent_given)
      end
    end
  end
end
