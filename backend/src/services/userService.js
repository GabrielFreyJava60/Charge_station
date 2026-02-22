const { tables, getItem, putItem, updateItem, scanTable } = require('../utils/dynamodb');
const { NotFoundError } = require('../utils/errors');

async function getUser(userId) {
  const item = await getItem(tables.users, `USER#${userId}`, 'METADATA');
  if (!item) throw new NotFoundError('User', userId);
  return _formatUser(item);
}

async function createOrUpdateUser(userData) {
  const item = {
    PK: `USER#${userData.userId}`,
    SK: 'METADATA',
    userId: userData.userId,
    email: userData.email,
    name: userData.name || '',
    role: userData.role || 'USER',
    blocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existing = await getItem(tables.users, item.PK, item.SK);
  if (existing) {
    item.createdAt = existing.createdAt;
    item.blocked = existing.blocked;
    item.role = existing.role;
  }

  await putItem(tables.users, item);
  return _formatUser(item);
}

async function updateUserRole(userId, newRole) {
  const result = await updateItem(
    tables.users,
    `USER#${userId}`, 'METADATA',
    'SET #role = :role, updatedAt = :now',
    { ':role': newRole, ':now': new Date().toISOString() },
    { '#role': 'role' },
  );
  return _formatUser(result);
}

async function blockUser(userId, blocked) {
  const result = await updateItem(
    tables.users,
    `USER#${userId}`, 'METADATA',
    'SET blocked = :blocked, updatedAt = :now',
    { ':blocked': blocked, ':now': new Date().toISOString() },
  );
  return _formatUser(result);
}

async function deleteUser(userId) {
  const { deleteItem } = require('../utils/dynamodb');
  await deleteItem(tables.users, `USER#${userId}`, 'METADATA');
}

async function listUsers() {
  const items = await scanTable(
    tables.users,
    'SK = :sk',
    { ':sk': 'METADATA' },
  );
  return items.map(_formatUser);
}

function _formatUser(item) {
  return {
    userId: item.userId,
    email: item.email,
    name: item.name,
    role: item.role,
    blocked: item.blocked || false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

module.exports = {
  getUser,
  createOrUpdateUser,
  updateUserRole,
  blockUser,
  deleteUser,
  listUsers,
};
