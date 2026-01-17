# Reject

## Purpose
Describes the 'reject' action in MDM Approval.

## Logic
1. **Pre-checks**: Verify current status allows this action.
2. **Execution**: Call backend API `reject`.
3. **Post-processing**: Update status, send notifications, or trigger integration.

## Related Documentation
- **API Endpoint**: [Endpoints](../api/endpoints.md)
- **Status Change**: [Status Values](../../../status-management/status-values.md)

← Back to [MDM Approval App](../README.md)
