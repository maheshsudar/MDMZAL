type DuplicateResult {
  sapBpNumber : String;
  partnerName : String;
  vatId : String;
  street : String;
  city : String;
  country : String;
  matchScore : Integer;
}

type PartnerAddress {
  addressType : String;
  street : String;
  city : String;
  postalCode : String;
  country : String;
}

type PartnerTaxNumber {
  country : String;
  taxType : String;
  taxNumber : String;
}

type PartnerBank {
  bankName : String;
  bankCountry : String;
  iban : String;
  accountNumber : String;
  swiftCode : String;
}

type PartnerContacts {
  email : String;
  phone : String;
  fax : String;
}

type PartnerDetails {
  sapBpNumber : String;
  partnerName : String;
  partnerRole : String;
  status : String;
  satelliteSystemId : String;
  addresses : many PartnerAddress;
  taxNumbers : many PartnerTaxNumber;
  bankAccounts : many PartnerBank;
  contacts : PartnerContacts;
}
