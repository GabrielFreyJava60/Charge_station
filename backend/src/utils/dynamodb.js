const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const config = require('../config');

const clientConfig = { region: config.aws.region };
if (config.dynamodb.endpoint) {
  clientConfig.endpoint = config.dynamodb.endpoint;
  clientConfig.credentials = { accessKeyId: 'fakeKey', secretAccessKey: 'fakeSecret' };
}

const ddbClient = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

const tables = config.dynamodb.tables;

async function getItem(tableName, pk, sk) {
  const { Item } = await docClient.send(new GetCommand({
    TableName: tableName,
    Key: { PK: pk, SK: sk },
  }));
  return Item || null;
}

async function putItem(tableName, item, conditionExpression) {
  const params = { TableName: tableName, Item: item };
  if (conditionExpression) {
    params.ConditionExpression = conditionExpression;
  }
  await docClient.send(new PutCommand(params));
  return item;
}

async function updateItem(tableName, pk, sk, updateExpr, exprAttrValues, exprAttrNames, conditionExpression) {
  const params = {
    TableName: tableName,
    Key: { PK: pk, SK: sk },
    UpdateExpression: updateExpr,
    ExpressionAttributeValues: exprAttrValues,
    ReturnValues: 'ALL_NEW',
  };
  if (exprAttrNames) params.ExpressionAttributeNames = exprAttrNames;
  if (conditionExpression) params.ConditionExpression = conditionExpression;
  const { Attributes } = await docClient.send(new UpdateCommand(params));
  return Attributes;
}

async function deleteItem(tableName, pk, sk) {
  await docClient.send(new DeleteCommand({
    TableName: tableName,
    Key: { PK: pk, SK: sk },
  }));
}

async function queryByPK(tableName, pk, skPrefix) {
  const keyCondition = skPrefix
    ? 'PK = :pk AND begins_with(SK, :sk)'
    : 'PK = :pk';
  const exprValues = { ':pk': pk };
  if (skPrefix) exprValues[':sk'] = skPrefix;

  const { Items } = await docClient.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: keyCondition,
    ExpressionAttributeValues: exprValues,
  }));
  return Items || [];
}

const RESERVED_WORDS = new Set(['status', 'name', 'level', 'timestamp', 'service', 'role']);

async function queryGSI(tableName, indexName, pkAttr, pkValue, options = {}) {
  const exprAttrNames = {};
  const exprValues = { ':pkVal': pkValue };

  let pkRef = pkAttr;
  if (RESERVED_WORDS.has(pkAttr.toLowerCase())) {
    pkRef = `#${pkAttr}`;
    exprAttrNames[pkRef] = pkAttr;
  }
  let keyCondition = `${pkRef} = :pkVal`;

  if (options.skAttr && options.skValue) {
    let skRef = options.skAttr;
    if (RESERVED_WORDS.has(options.skAttr.toLowerCase())) {
      skRef = `#${options.skAttr}`;
      exprAttrNames[skRef] = options.skAttr;
    }
    keyCondition += ` AND ${skRef} = :skVal`;
    exprValues[':skVal'] = options.skValue;
  }

  const params = {
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: keyCondition,
    ExpressionAttributeValues: exprValues,
    ScanIndexForward: options.scanForward !== false,
  };
  if (Object.keys(exprAttrNames).length > 0) {
    params.ExpressionAttributeNames = exprAttrNames;
  }
  if (options.limit) params.Limit = options.limit;

  const { Items } = await docClient.send(new QueryCommand(params));
  return Items || [];
}

async function scanTable(tableName, filterExpression, exprAttrValues, exprAttrNames) {
  const params = { TableName: tableName };
  if (filterExpression) {
    params.FilterExpression = filterExpression;
    params.ExpressionAttributeValues = exprAttrValues;
  }
  if (exprAttrNames) params.ExpressionAttributeNames = exprAttrNames;
  const { Items } = await docClient.send(new ScanCommand(params));
  return Items || [];
}

module.exports = {
  docClient,
  tables,
  getItem,
  putItem,
  updateItem,
  deleteItem,
  queryByPK,
  queryGSI,
  scanTable,
};
