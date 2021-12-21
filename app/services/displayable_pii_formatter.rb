class DisplayablePiiFormatter
  attr_reader :current_user
  attr_reader :pii

  def initialize(current_user:, pii:)
    @current_user = current_user
    @pii = pii
  end

  def format
    formatted_pii = {
      email: email,
      all_emails: all_emails,
      verified_at: verified_at,
      x509_subject: x509_subject,
      x509_issuer: x509_issuer,
    }
    formatted_pii.merge!(formatted_ial2_pii) if pii.any?
    formatted_pii
  end

  private

  def formatted_ial2_pii
    {
      full_name: full_name,
      social_security_number: social_security_number,
      address: address,
      birthdate: dob,
      phone: phone,
    }
  end

  def email
    EmailContext.new(current_user).last_sign_in_email_address.email
  end

  def all_emails
    current_user.confirmed_email_addresses.map(&:email)
  end

  def verified_at
    timestamp = current_user.active_profile&.verified_at
    if timestamp
      I18n.l(timestamp, format: :event_timestamp)
    else
      I18n.t('help_text.requested_attributes.verified_at_blank')
    end
  end

  def x509_subject
    current_user.piv_cac_configurations.first&.x509_dn_uuid
  end

  def x509_issuer
    current_user.piv_cac_configurations.first&.x509_issuer
  end

  def full_name
    "#{pii[:first_name]} #{pii[:last_name]}"
  end

  def social_security_number
    SsnFormatter.format(pii[:ssn])
  end

  def address
    addr = pii[:address2]
    addr = addr.present? ? "#{addr} " : ''
    "#{pii[:address1]} #{addr}#{pii[:city]}, #{pii[:state]} #{pii[:zipcode]}"
  end

  def dob
    pii_dob = pii[:dob]
    pii_dob ? DateParser.parse_legacy(pii_dob).to_formatted_s(:long) : ''
  end

  def phone
    PhoneFormatter.format(pii[:phone].to_s)
  end
end
