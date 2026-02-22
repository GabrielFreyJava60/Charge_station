#!/usr/bin/env bash
set -euo pipefail

ENDPOINT="http://localhost:8000"
REGION="us-east-1"

echo "=== EV Charging Station — Local Setup ==="

if ! curl -s "$ENDPOINT" > /dev/null 2>&1; then
  echo "Starting DynamoDB Local via Docker..."
  docker run -d --name dynamodb-local -p 8000:8000 amazon/dynamodb-local:latest
  sleep 2
fi

echo "Creating DynamoDB tables..."

aws dynamodb create-table \
  --table-name Stations \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=stationId,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    'IndexName=status-index,KeySchema=[{AttributeName=status,KeyType=HASH},{AttributeName=stationId,KeyType=RANGE}],Projection={ProjectionType=ALL}' \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" 2>/dev/null || echo "  Stations table already exists"

aws dynamodb create-table \
  --table-name Sessions \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=updatedAt,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    'IndexName=userId-index,KeySchema=[{AttributeName=userId,KeyType=HASH},{AttributeName=createdAt,KeyType=RANGE}],Projection={ProjectionType=ALL}' \
    'IndexName=status-index,KeySchema=[{AttributeName=status,KeyType=HASH},{AttributeName=updatedAt,KeyType=RANGE}],Projection={ProjectionType=ALL}' \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" 2>/dev/null || echo "  Sessions table already exists"

aws dynamodb create-table \
  --table-name Users \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" 2>/dev/null || echo "  Users table already exists"

aws dynamodb create-table \
  --table-name ErrorLogs \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=level,AttributeType=S \
    AttributeName=service,AttributeType=S \
    AttributeName=logStatus,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    'IndexName=level-index,KeySchema=[{AttributeName=level,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL}' \
    'IndexName=service-index,KeySchema=[{AttributeName=service,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL}' \
    'IndexName=status-index,KeySchema=[{AttributeName=logStatus,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL}' \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" 2>/dev/null || echo "  ErrorLogs table already exists"

echo ""
echo "Seeding sample data..."

aws dynamodb put-item \
  --table-name Stations \
  --item '{
    "PK": {"S": "STATION#station-001"},
    "SK": {"S": "METADATA"},
    "stationId": {"S": "station-001"},
    "name": {"S": "Downtown Charging Hub"},
    "address": {"S": "123 Main Street, EV City"},
    "latitude": {"N": "40.7128"},
    "longitude": {"N": "-74.0060"},
    "status": {"S": "ACTIVE"},
    "totalPorts": {"N": "3"},
    "powerKw": {"N": "150"},
    "tariffPerKwh": {"N": "0.35"},
    "createdAt": {"S": "2026-01-01T00:00:00Z"},
    "updatedAt": {"S": "2026-01-01T00:00:00Z"}
  }' \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION"

for i in 1 2 3; do
  aws dynamodb put-item \
    --table-name Stations \
    --item "{
      \"PK\": {\"S\": \"STATION#station-001\"},
      \"SK\": {\"S\": \"PORT#port-00$i\"},
      \"portId\": {\"S\": \"port-00$i\"},
      \"stationId\": {\"S\": \"station-001\"},
      \"status\": {\"S\": \"FREE\"},
      \"portNumber\": {\"N\": \"$i\"},
      \"updatedAt\": {\"S\": \"2026-01-01T00:00:00Z\"}
    }" \
    --endpoint-url "$ENDPOINT" \
    --region "$REGION"
done

aws dynamodb put-item \
  --table-name Stations \
  --item '{
    "PK": {"S": "STATION#station-002"},
    "SK": {"S": "METADATA"},
    "stationId": {"S": "station-002"},
    "name": {"S": "Airport Fast Charge"},
    "address": {"S": "456 Airport Blvd, EV City"},
    "latitude": {"N": "40.6413"},
    "longitude": {"N": "-73.7781"},
    "status": {"S": "ACTIVE"},
    "totalPorts": {"N": "2"},
    "powerKw": {"N": "350"},
    "tariffPerKwh": {"N": "0.50"},
    "createdAt": {"S": "2026-01-15T00:00:00Z"},
    "updatedAt": {"S": "2026-01-15T00:00:00Z"}
  }' \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION"

for i in 1 2; do
  aws dynamodb put-item \
    --table-name Stations \
    --item "{
      \"PK\": {\"S\": \"STATION#station-002\"},
      \"SK\": {\"S\": \"PORT#port-00$i\"},
      \"portId\": {\"S\": \"port-00$i\"},
      \"stationId\": {\"S\": \"station-002\"},
      \"status\": {\"S\": \"FREE\"},
      \"portNumber\": {\"N\": \"$i\"},
      \"updatedAt\": {\"S\": \"2026-01-15T00:00:00Z\"}
    }" \
    --endpoint-url "$ENDPOINT" \
    --region "$REGION"
done

echo ""
echo "=== Local setup complete ==="
echo "DynamoDB Local: $ENDPOINT"
echo "Tables: Stations, Sessions, Users, ErrorLogs"
