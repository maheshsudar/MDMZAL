# Validation Framework

## How Validation Works
The validation framework is a dynamic, database-driven system that applies business rules to request data. Rather than hardcoding validation logic, rules are stored as data and can be modified through the Admin Config app.

## Rule Fallback Logic
Rules are applied using a fallback mechanism that finds the most specific matching rule:
1. Try: SourceSystem + EntityType + RequestType + Field
2. Try: SourceSystem + EntityType + Field
3. Try: SourceSystem + Field
4. Try: Field only (universal rule)

## Validation Types
- **Required**: Field must have a value
- **MinLength**: String must be at least N characters
- **MaxLength**: String must be at most N characters
- **Regex**: Value must match a regular expression pattern
- **Email**: Must be a valid email format
- **VAT**: Must be a valid country-specific VAT format
- **IBAN**: Must be a valid IBAN with check digit
- **MinCount**: Child entity must have at least N records
- **Custom**: Calls a custom JavaScript function for complex logic
