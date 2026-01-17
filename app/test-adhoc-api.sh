#!/bin/bash
curl -X POST "http://localhost:4004/mdm/createAdhocSyncRequest" \
  -H "Content-Type: application/json" \
  -d '{"sapBpNumber":"0000100001","existingBpName":"Acme Corporation","targetSystem":"Coupa","adhocReason":"Testing adhoc sync - Automation failed, manual sync required"}'
