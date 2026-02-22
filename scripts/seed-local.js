const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const ENDPOINT = 'http://localhost:8000';
const REGION = 'us-east-1';

const client = new DynamoDBClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: { accessKeyId: 'fakeKey', secretAccessKey: 'fakeSecret' },
});
const doc = DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } });

const TABLES = [
  {
    TableName: 'Stations',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
      { AttributeName: 'stationId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'status-index',
        KeySchema: [
          { AttributeName: 'status', KeyType: 'HASH' },
          { AttributeName: 'stationId', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'Sessions',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
      { AttributeName: 'updatedAt', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'userId-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'status-index',
        KeySchema: [
          { AttributeName: 'status', KeyType: 'HASH' },
          { AttributeName: 'updatedAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'Users',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'ErrorLogs',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'level', AttributeType: 'S' },
      { AttributeName: 'service', AttributeType: 'S' },
      { AttributeName: 'logStatus', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'level-index',
        KeySchema: [
          { AttributeName: 'level', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'service-index',
        KeySchema: [
          { AttributeName: 'service', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'status-index',
        KeySchema: [
          { AttributeName: 'logStatus', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
];

async function createTables() {
  const { TableNames } = await client.send(new ListTablesCommand({}));
  console.log('Существующие таблицы:', TableNames);

  for (const table of TABLES) {
    if (TableNames.includes(table.TableName)) {
      console.log(`  ✓ ${table.TableName} уже существует`);
      continue;
    }
    try {
      await client.send(new CreateTableCommand(table));
      console.log(`  + ${table.TableName} создана`);
    } catch (err) {
      console.error(`  ✗ ${table.TableName}: ${err.message}`);
    }
  }
}

async function put(table, item) {
  await doc.send(new PutCommand({ TableName: table, Item: item }));
}

async function seedData() {
  console.log('\nЗаполнение seed-данными...');

  await put('Stations', {
    PK: 'STATION#station-001', SK: 'METADATA',
    stationId: 'station-001', name: 'Центральный хаб зарядки', address: 'ул. Главная, 123',
    latitude: 40.7128, longitude: -74.0060, status: 'ACTIVE',
    totalPorts: 3, powerKw: 150, tariffPerKwh: 0.35,
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  });
  for (let i = 1; i <= 3; i++) {
    await put('Stations', {
      PK: 'STATION#station-001', SK: `PORT#port-00${i}`,
      portId: `port-00${i}`, stationId: 'station-001', portNumber: i,
      status: 'FREE', updatedAt: '2026-01-01T00:00:00Z',
    });
  }
  console.log('  + station-001 (Центральный хаб, 3 порта, ACTIVE)');

  await put('Stations', {
    PK: 'STATION#station-002', SK: 'METADATA',
    stationId: 'station-002', name: 'Аэропорт Быстрая Зарядка', address: 'бульвар Аэропорт, 456',
    latitude: 40.6413, longitude: -73.7781, status: 'ACTIVE',
    totalPorts: 2, powerKw: 350, tariffPerKwh: 0.50,
    createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z',
  });
  for (let i = 1; i <= 2; i++) {
    await put('Stations', {
      PK: 'STATION#station-002', SK: `PORT#port-00${i}`,
      portId: `port-00${i}`, stationId: 'station-002', portNumber: i,
      status: 'FREE', updatedAt: '2026-01-15T00:00:00Z',
    });
  }
  console.log('  + station-002 (Аэропорт, 2 порта, ACTIVE)');

  await put('Stations', {
    PK: 'STATION#station-003', SK: 'METADATA',
    stationId: 'station-003', name: 'Парковый зарядный пост', address: 'пр-т Парковый, 789',
    latitude: 40.7580, longitude: -73.9855, status: 'NEW',
    totalPorts: 4, powerKw: 200, tariffPerKwh: 0.40,
    createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z',
  });
  for (let i = 1; i <= 4; i++) {
    await put('Stations', {
      PK: 'STATION#station-003', SK: `PORT#port-00${i}`,
      portId: `port-00${i}`, stationId: 'station-003', portNumber: i,
      status: 'FREE', updatedAt: '2026-02-01T00:00:00Z',
    });
  }
  console.log('  + station-003 (Парковый пост, 4 порта, NEW)');

  const now = new Date().toISOString();
  await put('Users', {
    PK: 'USER#dev-user', SK: 'METADATA',
    userId: 'dev-user', email: 'user@test.com', name: 'Тест Юзер',
    role: 'USER', blocked: false, createdAt: now, updatedAt: now,
  });
  await put('Users', {
    PK: 'USER#dev-tech', SK: 'METADATA',
    userId: 'dev-tech', email: 'tech@test.com', name: 'Тест Техподдержка',
    role: 'TECH_SUPPORT', blocked: false, createdAt: now, updatedAt: now,
  });
  await put('Users', {
    PK: 'USER#dev-admin', SK: 'METADATA',
    userId: 'dev-admin', email: 'admin@test.com', name: 'Тест Админ',
    role: 'ADMIN', blocked: false, createdAt: now, updatedAt: now,
  });
  console.log('  + 3 пользователя (user, tech, admin)');

  console.log('\n✓ Seed-данные загружены!');
}

async function main() {
  console.log('=== DynamoDB Local — Инициализация ===\n');
  await createTables();
  await seedData();
  console.log('\n=== Готово! DynamoDB Local: http://localhost:8000 ===');
}

main().catch(console.error);
