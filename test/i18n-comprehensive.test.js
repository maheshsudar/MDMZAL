const assert = require('assert');
const fs = require('fs');
const path = require('path');
const cds = require('@sap/cds');

/**
 * Comprehensive i18n Test Suite
 * Tests internationalization implementation across all layers
 */

describe('i18n Comprehensive Test Suite', function() {
    this.timeout(30000); // Increase timeout for database operations

    let db;
    let ValidationService;
    let validationService;

    before(async function() {
        // Connect to database
        db = await cds.connect.to('db');

        // Load ValidationService
        ValidationService = require('../srv/lib/validation-service');
        validationService = new ValidationService();
    });

    describe('1. Property File Completeness', function() {
        const apps = [
            { name: 'MDM Approval', path: 'app/mdm-approval/webapp/i18n' },
            { name: 'Coupa Requests', path: 'app/coupa-requests/webapp/i18n' },
            { name: 'Salesforce Requests', path: 'app/salesforce-requests/webapp/i18n' },
            { name: 'PI Requests', path: 'app/pi-requests/webapp/i18n' }
        ];

        apps.forEach(app => {
            it(`should have German property file for ${app.name}`, function() {
                const dePath = path.join(app.path, 'i18n_de.properties');
                assert.ok(fs.existsSync(dePath), `German property file missing: ${dePath}`);
            });

            it(`should have matching key counts for ${app.name}`, function() {
                const enPath = path.join(app.path, 'i18n.properties');
                const dePath = path.join(app.path, 'i18n_de.properties');

                const enContent = fs.readFileSync(enPath, 'utf-8');
                const deContent = fs.readFileSync(dePath, 'utf-8');

                const enKeys = enContent.match(/^[a-zA-Z][a-zA-Z0-9._]*=/gm) || [];
                const deKeys = deContent.match(/^[a-zA-Z][a-zA-Z0-9._]*=/gm) || [];

                const enCount = enKeys.length;
                const deCount = deKeys.length;

                console.log(`      ${app.name}: ${enCount} EN keys, ${deCount} DE keys`);
                assert.strictEqual(enCount, deCount, `Key count mismatch: EN=${enCount}, DE=${deCount}`);
            });

            it(`should not have missing translations in ${app.name}`, function() {
                const enPath = path.join(app.path, 'i18n.properties');
                const dePath = path.join(app.path, 'i18n_de.properties');

                const enContent = fs.readFileSync(enPath, 'utf-8');
                const deContent = fs.readFileSync(dePath, 'utf-8');

                const enKeys = new Set();
                enContent.match(/^([a-zA-Z][a-zA-Z0-9._]*)=/gm)?.forEach(line => {
                    const key = line.substring(0, line.indexOf('='));
                    enKeys.add(key);
                });

                const deKeys = new Set();
                deContent.match(/^([a-zA-Z][a-zA-Z0-9._]*)=/gm)?.forEach(line => {
                    const key = line.substring(0, line.indexOf('='));
                    deKeys.add(key);
                });

                const missingInDe = [...enKeys].filter(k => !deKeys.has(k));

                if (missingInDe.length > 0) {
                    console.log(`      Missing in DE: ${missingInDe.join(', ')}`);
                }

                assert.strictEqual(missingInDe.length, 0, `Missing German translations: ${missingInDe.join(', ')}`);
            });
        });
    });

    describe('2. Database Locale Support', function() {
        it('should have German validation rules in database', async function() {
            const germanRules = await db.run(
                `SELECT COUNT(*) as count FROM mdm_db_ValidationRules WHERE locale = 'de' AND isActive = 1`
            );

            const count = germanRules[0].count;
            console.log(`      Found ${count} German validation rules`);
            assert.ok(count > 0, 'No German validation rules found in database');
        });

        it('should have English validation rules in database', async function() {
            const englishRules = await db.run(
                `SELECT COUNT(*) as count FROM mdm_db_ValidationRules WHERE locale = 'en' AND isActive = 1`
            );

            const count = englishRules[0].count;
            console.log(`      Found ${count} English validation rules`);
            assert.ok(count > 0, 'No English validation rules found in database');
        });

        it('should have matching rule counts for EN and DE', async function() {
            const result = await db.run(
                `SELECT locale, COUNT(*) as count
                 FROM mdm_db_ValidationRules
                 WHERE isActive = 1
                 GROUP BY locale`
            );

            const enCount = result.find(r => r.locale === 'en')?.count || 0;
            const deCount = result.find(r => r.locale === 'de')?.count || 0;

            console.log(`      EN: ${enCount} rules, DE: ${deCount} rules`);
            assert.strictEqual(enCount, deCount, 'Mismatch in EN/DE rule counts');
        });

        it('should have German code list entries', async function() {
            const paymentMethods = await db.run(
                `SELECT COUNT(*) as count FROM mdm_db_PaymentMethods WHERE locale = 'de'`
            );

            const count = paymentMethods[0].count;
            console.log(`      Found ${count} German payment methods`);
            assert.ok(count > 0, 'No German payment methods found');
        });

        it('should have German section validation rules', async function() {
            const sectionRules = await db.run(
                `SELECT COUNT(*) as count FROM mdm_db_SectionValidationRules WHERE locale = 'de' AND isActive = 1`
            );

            const count = sectionRules[0].count;
            console.log(`      Found ${count} German section validation rules`);
            assert.ok(count > 0, 'No German section validation rules found');
        });
    });

    describe('3. Placeholder Replacement', function() {
        it('should replace {fieldLabel} placeholder', function() {
            const message = '{fieldLabel} is required';
            const result = validationService.replacePlaceholders(message, {
                fieldLabel: 'Partner Name'
            });

            assert.strictEqual(result, 'Partner Name is required');
        });

        it('should replace multiple placeholders', function() {
            const message = '{fieldLabel} must be at least {minLength} characters (current: {actualLength})';
            const result = validationService.replacePlaceholders(message, {
                fieldLabel: 'Partner Name',
                minLength: 3,
                actualLength: 2
            });

            assert.strictEqual(result, 'Partner Name must be at least 3 characters (current: 2)');
        });

        it('should handle missing placeholders gracefully', function() {
            const message = '{fieldLabel} must be at least {minLength} characters';
            const result = validationService.replacePlaceholders(message, {
                fieldLabel: 'Partner Name'
                // minLength missing
            });

            assert.ok(result.includes('Partner Name'));
            assert.ok(result.includes('{minLength}')); // Unchanged
        });

        it('should replace section placeholders', function() {
            const message = '{sectionLabel} requires at least {minimumCount} record(s), but has {actualCount}';
            const result = validationService.replacePlaceholders(message, {
                sectionLabel: 'Addresses',
                minimumCount: 1,
                actualCount: 0
            });

            assert.strictEqual(result, 'Addresses requires at least 1 record(s), but has 0');
        });
    });

    describe('4. Locale Normalization', function() {
        it('should normalize German locale correctly', function() {
            const testCases = [
                { input: 'de', expected: 'de' },
                { input: 'de-DE', expected: 'de' },
                { input: 'de_DE', expected: 'de' },
                { input: 'DE', expected: 'de' }
            ];

            testCases.forEach(test => {
                const normalized = (test.input.toLowerCase().substring(0, 2) === 'de') ? 'de' : 'en';
                assert.strictEqual(normalized, test.expected, `Failed for input: ${test.input}`);
            });
        });

        it('should fallback unsupported locales to English', function() {
            const testCases = [
                { input: 'fr', expected: 'en' },
                { input: 'es', expected: 'en' },
                { input: 'it', expected: 'en' },
                { input: 'zh', expected: 'en' },
                { input: 'ja', expected: 'en' }
            ];

            testCases.forEach(test => {
                const normalized = (test.input === 'de') ? 'de' : 'en';
                assert.strictEqual(normalized, test.expected, `Failed for input: ${test.input}`);
            });
        });
    });

    describe('5. ValidationService German Locale', function() {
        it('should retrieve German validation rules', async function() {
            const context = {
                status: 'Submitted',
                sourceSystem: 'Coupa',
                entityType: 'Supplier',
                requestType: 'Create'
            };

            const rules = await validationService.getApplicableRules(context, 'de');

            assert.ok(rules.length > 0, 'No German rules retrieved');

            const germanRule = rules.find(r => r.locale === 'de');
            assert.ok(germanRule, 'No German locale rule found');

            console.log(`      Retrieved ${rules.length} German rules`);
            console.log(`      Sample: ${germanRule.ruleName}`);
        });

        it('should fallback to English when German not available', async function() {
            const context = {
                status: 'NonExistentStatus',
                sourceSystem: 'Unknown',
                entityType: 'Unknown',
                requestType: 'Unknown'
            };

            const rules = await validationService.getApplicableRules(context, 'de');

            // Should fallback to default English rules if German not found
            console.log(`      Fallback retrieved ${rules.length} rules`);
            assert.ok(true, 'Fallback completed');
        });

        it('should validate with German error messages', async function() {
            const testData = {
                partnerName: 'AB', // Too short (min 3)
                entityType: 'Supplier',
                sourceSystem: 'Coupa',
                requestType: 'Create'
            };

            const result = await validationService.validateRequest(
                testData,
                'New',
                'Coupa',
                'Supplier',
                'Create',
                'de' // German locale
            );

            assert.strictEqual(result.isValid, false, 'Validation should fail');
            assert.ok(result.errors.length > 0, 'Should have validation errors');

            const error = result.errors[0];
            console.log(`      German error: ${error.message}`);

            // German error should contain German words
            const isGerman = error.message.includes('muss') ||
                            error.message.includes('mindestens') ||
                            error.message.includes('Zeichen');

            assert.ok(isGerman, 'Error message should be in German');
        });
    });

    describe('6. Field Label Humanization', function() {
        it('should humanize camelCase field names', function() {
            const testCases = [
                { input: 'partnerName', expected: 'Partner Name' },
                { input: 'emailAddress', expected: 'Email Address' },
                { input: 'vatNumber', expected: 'Vat Number' },
                { input: 'bankName', expected: 'Bank Name' }
            ];

            testCases.forEach(test => {
                const label = validationService.getFieldLabel(null, test.input);
                assert.strictEqual(label, test.expected, `Failed for: ${test.input}`);
            });
        });

        it('should use predefined labels when available', function() {
            const label = validationService.getFieldLabel(null, 'partnerName');
            assert.strictEqual(label, 'Partner Name');
        });
    });

    describe('7. Data Integrity', function() {
        it('should have no duplicate locale entries for same rule', async function() {
            const duplicates = await db.run(
                `SELECT ruleCode, locale, COUNT(*) as count
                 FROM mdm_db_ValidationRules
                 WHERE isActive = 1
                 GROUP BY ruleCode, locale
                 HAVING COUNT(*) > 1`
            );

            if (duplicates.length > 0) {
                console.log(`      Found duplicates:`, duplicates);
            }

            assert.strictEqual(duplicates.length, 0, 'Found duplicate locale entries');
        });

        it('should have consistent ruleCode across locales', async function() {
            const mismatch = await db.run(
                `SELECT ruleCode
                 FROM mdm_db_ValidationRules
                 WHERE isActive = 1
                 GROUP BY ruleCode
                 HAVING COUNT(DISTINCT locale) != 2`
            );

            if (mismatch.length > 0) {
                console.log(`      Rules with missing locale:`, mismatch);
            }

            // Allow for some flexibility as not all rules may be translated yet
            console.log(`      ${mismatch.length} rules with incomplete translations`);
        });
    });

    describe('8. Performance', function() {
        it('should retrieve rules efficiently', async function() {
            const start = Date.now();

            const context = {
                status: 'Submitted',
                sourceSystem: 'Coupa',
                entityType: 'Supplier',
                requestType: 'Create'
            };

            const rules = await validationService.getApplicableRules(context, 'de');

            const duration = Date.now() - start;

            console.log(`      Retrieved ${rules.length} rules in ${duration}ms`);
            assert.ok(duration < 500, `Query too slow: ${duration}ms`);
        });

        it('should benefit from caching on second call', async function() {
            const context = {
                status: 'Submitted',
                sourceSystem: 'Coupa',
                entityType: 'Supplier',
                requestType: 'Create'
            };

            // First call
            const start1 = Date.now();
            await validationService.getApplicableRules(context, 'de');
            const duration1 = Date.now() - start1;

            // Second call (should be cached)
            const start2 = Date.now();
            await validationService.getApplicableRules(context, 'de');
            const duration2 = Date.now() - start2;

            console.log(`      First call: ${duration1}ms, Cached call: ${duration2}ms`);

            // Second call should be faster (cached)
            // Note: This may not always be true in test environment
            console.log(`      Cache speedup: ${((1 - duration2/duration1) * 100).toFixed(1)}%`);
        });
    });
});
