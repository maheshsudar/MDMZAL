/**
 * Create PI test data using OData service layer (proper CAP pattern)
 * This script makes HTTP POST requests to the PIService OData endpoint
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4004/pi';

// Test data for 10 PI requests
const piTestRequests = [
  {
    name1: 'Manufacturing Solutions Inc',
    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'PI',
    piInternalNo: 'PI-SUP-001',
    communicationLanguage: 'en',
    currency_code: 'USD',
    paymentTerms_code: 'NET30',
    paymentMethod_code: 'BANK_TRANSFER',
    addresses: [
      {
        addressType_code: 'Main',
        name1: 'Manufacturing Solutions Inc',
        street: 'Innovation Drive',
        streetNumber: '1234',
        city: 'Detroit',
        postalCode: '48201',
        country_code: 'US',
        region: 'MI',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'US',
        vatNumber: 'US123456789',
        vatType_code: 'TAX_ID',
        isEstablished: true,
        isDefault: true
      }
    ],
    banks: [
      {
        bankCountry_code: 'US',
        bankName: 'Chase Bank',
        accountHolder: 'Manufacturing Solutions Inc',
        accountNumber: '1234567890',
        swiftCode: 'CHASUS33',
        currency_code: 'USD',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'Work',
        emailAddress: 'contact@manusolutions.com',
        isDefault: true
      }
    ]
  },
  {
    name1: 'Industrial Components Ltd',

    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'PI',
    piInternalNo: 'PI-SUP-002',
    communicationLanguage: 'en',
    currency_code: 'GBP',
    paymentTerms_code: 'NET30',
    paymentMethod_code: 'BANK_TRANSFER',
    addresses: [
      {
        addressType_code: 'Main',
        name1: 'Industrial Components Ltd',
        street: 'Industrial Park Road',
        streetNumber: '45',
        city: 'Birmingham',
        postalCode: 'B1 1AA',
        country_code: 'GB',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'GB',
        vatNumber: 'GB123456789',
        vatType_code: 'VAT_ID',
        isEstablished: true,
        isDefault: true
      }
    ],
    banks: [
      {
        bankCountry_code: 'GB',
        bankName: 'Barclays Bank',
        accountHolder: 'Industrial Components Ltd',
        iban: 'GB29NWBK60161331926819',
        swiftCode: 'BARCGB22',
        currency_code: 'GBP',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'Work',
        emailAddress: 'info@indcomp.co.uk',
        isDefault: true
      }
    ]
  },
  {
    name1: 'European Auto Parts GmbH',

    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'PI',
    piInternalNo: 'PI-SUP-003',
    communicationLanguage: 'de',
    currency_code: 'EUR',
    paymentTerms_code: 'NET30',
    paymentMethod_code: 'BANK_TRANSFER',
    addresses: [
      {
        addressType_code: 'Main',
        name1: 'European Auto Parts GmbH',
        street: 'Industriestraße',
        streetNumber: '88',
        city: 'Stuttgart',
        postalCode: '70597',
        country_code: 'DE',
        region: 'BW',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'DE',
        vatNumber: 'DE123456789',
        vatType_code: 'VAT_ID',
        isEstablished: true,
        isDefault: true
      }
    ],
    banks: [
      {
        bankCountry_code: 'DE',
        bankName: 'Deutsche Bank',
        accountHolder: 'European Auto Parts GmbH',
        iban: 'DE89370400440532013000',
        swiftCode: 'DEUTDEFF',
        currency_code: 'EUR',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'Work',
        emailAddress: 'kontakt@euroauto.de',
        isDefault: true
      }
    ]
  },
  {
    name1: 'Asian Electronics Co Ltd',

    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'PI',
    piInternalNo: 'PI-SUP-004',
    communicationLanguage: 'en',
    currency_code: 'JPY',
    paymentTerms_code: 'NET30',
    paymentMethod_code: 'BANK_TRANSFER',
    addresses: [
      {
        addressType_code: 'Main',
        name1: 'Asian Electronics Co Ltd',
        street: 'Shibuya District',
        streetNumber: '2-3-5',
        city: 'Tokyo',
        postalCode: '150-0002',
        country_code: 'JP',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'JP',
        vatNumber: 'JP123456789012',
        vatType_code: 'TAX_ID',
        isEstablished: true,
        isDefault: true
      }
    ],
    banks: [
      {
        bankCountry_code: 'JP',
        bankName: 'Mitsubishi UFJ Bank',
        accountHolder: 'Asian Electronics Co Ltd',
        accountNumber: '1234567',
        swiftCode: 'BOTKJPJT',
        currency_code: 'JPY',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'Work',
        emailAddress: 'contact@asiaelec.co.jp',
        isDefault: true
      }
    ]
  },
  {
    name1: 'French Materials SARL',

    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'PI',
    piInternalNo: 'PI-SUP-005',
    communicationLanguage: 'fr',
    currency_code: 'EUR',
    paymentTerms_code: 'NET30',
    paymentMethod_code: 'BANK_TRANSFER',
    addresses: [
      {
        addressType_code: 'Main',
        name1: 'French Materials SARL',
        street: 'Rue de la République',
        streetNumber: '123',
        city: 'Lyon',
        postalCode: '69001',
        country_code: 'FR',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'FR',
        vatNumber: 'FR12345678901',
        vatType_code: 'VAT_ID',
        isEstablished: true,
        isDefault: true
      }
    ],
    banks: [
      {
        bankCountry_code: 'FR',
        bankName: 'BNP Paribas',
        accountHolder: 'French Materials SARL',
        iban: 'FR1420041010050500013M02606',
        swiftCode: 'BNPAFRPP',
        currency_code: 'EUR',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'Work',
        emailAddress: 'contact@frenchmat.fr',
        isDefault: true
      }
    ]
  },
  {
    name1: 'Canadian Resources Corp',

    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'PI',
    piInternalNo: 'PI-SUP-006',
    communicationLanguage: 'en',
    currency_code: 'CAD',
    paymentTerms_code: 'NET30',
    paymentMethod_code: 'BANK_TRANSFER',
    addresses: [
      {
        addressType_code: 'Main',
        name1: 'Canadian Resources Corp',
        street: 'Bay Street',
        streetNumber: '500',
        city: 'Toronto',
        postalCode: 'M5H 2Y4',
        country_code: 'CA',
        region: 'ON',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'CA',
        vatNumber: 'CA123456789RT0001',
        vatType_code: 'TAX_ID',
        isEstablished: true,
        isDefault: true
      }
    ],
    banks: [
      {
        bankCountry_code: 'CA',
        bankName: 'Royal Bank of Canada',
        accountHolder: 'Canadian Resources Corp',
        accountNumber: '1234567',
        swiftCode: 'ROYCCAT2',
        currency_code: 'CAD',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'Work',
        emailAddress: 'info@canresources.ca',
        isDefault: true
      }
    ]
  },
  {
    name1: 'Italian Design House SRL',

    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'PI',
    piInternalNo: 'PI-SUP-007',
    communicationLanguage: 'it',
    currency_code: 'EUR',
    paymentTerms_code: 'NET30',
    paymentMethod_code: 'BANK_TRANSFER',
    addresses: [
      {
        addressType_code: 'Main',
        name1: 'Italian Design House SRL',
        street: 'Via della Moda',
        streetNumber: '25',
        city: 'Milan',
        postalCode: '20121',
        country_code: 'IT',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'IT',
        vatNumber: 'IT12345678901',
        vatType_code: 'VAT_ID',
        isEstablished: true,
        isDefault: true
      }
    ],
    banks: [
      {
        bankCountry_code: 'IT',
        bankName: 'UniCredit',
        accountHolder: 'Italian Design House SRL',
        iban: 'IT60X0542811101000000123456',
        swiftCode: 'UNCRITMM',
        currency_code: 'EUR',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'Work',
        emailAddress: 'contatto@itadesign.it',
        isDefault: true
      }
    ]
  },
  {
    name1: 'Nordic Machinery AB',

    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'PI',
    piInternalNo: 'PI-SUP-008',
    communicationLanguage: 'sv',
    currency_code: 'SEK',
    paymentTerms_code: 'NET30',
    paymentMethod_code: 'BANK_TRANSFER',
    addresses: [
      {
        addressType_code: 'Main',
        name1: 'Nordic Machinery AB',
        street: 'Industrigatan',
        streetNumber: '12',
        city: 'Stockholm',
        postalCode: '111 40',
        country_code: 'SE',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'SE',
        vatNumber: 'SE123456789001',
        vatType_code: 'VAT_ID',
        isEstablished: true,
        isDefault: true
      }
    ],
    banks: [
      {
        bankCountry_code: 'SE',
        bankName: 'Swedbank',
        accountHolder: 'Nordic Machinery AB',
        iban: 'SE4550000000058398257466',
        swiftCode: 'SWEDSESS',
        currency_code: 'SEK',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'Work',
        emailAddress: 'kontakt@nordicmach.se',
        isDefault: true
      }
    ]
  },
  {
    name1: 'Spanish Textiles SA',

    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'PI',
    piInternalNo: 'PI-SUP-009',
    communicationLanguage: 'es',
    currency_code: 'EUR',
    paymentTerms_code: 'NET30',
    paymentMethod_code: 'BANK_TRANSFER',
    addresses: [
      {
        addressType_code: 'Main',
        name1: 'Spanish Textiles SA',
        street: 'Calle del Textil',
        streetNumber: '67',
        city: 'Barcelona',
        postalCode: '08001',
        country_code: 'ES',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'ES',
        vatNumber: 'ESA12345678',
        vatType_code: 'VAT_ID',
        isEstablished: true,
        isDefault: true
      }
    ],
    banks: [
      {
        bankCountry_code: 'ES',
        bankName: 'Banco Santander',
        accountHolder: 'Spanish Textiles SA',
        iban: 'ES9121000418450200051332',
        swiftCode: 'BSCHESMM',
        currency_code: 'EUR',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'Work',
        emailAddress: 'contacto@esptextiles.es',
        isDefault: true
      }
    ]
  },
  {
    name1: 'Dutch Logistics BV',

    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'PI',
    piInternalNo: 'PI-SUP-010',
    communicationLanguage: 'nl',
    currency_code: 'EUR',
    paymentTerms_code: 'NET30',
    paymentMethod_code: 'BANK_TRANSFER',
    addresses: [
      {
        addressType_code: 'Main',
        name1: 'Dutch Logistics BV',
        street: 'Havenstraat',
        streetNumber: '89',
        city: 'Rotterdam',
        postalCode: '3011 VW',
        country_code: 'NL',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'NL',
        vatNumber: 'NL123456789B01',
        vatType_code: 'VAT_ID',
        isEstablished: true,
        isDefault: true
      }
    ],
    banks: [
      {
        bankCountry_code: 'NL',
        bankName: 'ING Bank',
        accountHolder: 'Dutch Logistics BV',
        iban: 'NL91ABNA0417164300',
        swiftCode: 'ABNANL2A',
        currency_code: 'EUR',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'Work',
        emailAddress: 'info@dutchlogistics.nl',
        isDefault: true
      }
    ]
  }
];

async function createPITestData() {
  console.log('🚀 Creating PI test data via OData service layer...\n');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < piTestRequests.length; i++) {
    const request = piTestRequests[i];

    try {
      console.log(`📤 Creating PI request ${i + 1}/10: ${request.name1}...`);

      // POST to PIRequests entity
      const response = await axios.post(`${BASE_URL}/PIRequests`, request, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`  ✅ Created: ${response.data.requestNumber} - ${request.name1}`);
      successCount++;

    } catch (error) {
      console.error(`  ❌ Error creating ${request.name1}:`);
      if (error.response) {
        console.error(`     Status: ${error.response.status}`);
        console.error(`     Message: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.error(`     ${error.message}`);
      }
      errorCount++;
    }
  }

  console.log('\n✅ PI test data creation completed!');
  console.log(`   Success: ${successCount} requests`);
  console.log(`   Errors: ${errorCount} requests`);
}

// Run the script
createPITestData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
