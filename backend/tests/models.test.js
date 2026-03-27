import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/models.js';

test('sequelize models are registered', () => {
  const requiredModels = [
    'User',
    'Tuition',
    'AppliedTuition',
    'BookedTuition',
    'Maid',
    'AppliedMaid',
    'BookedMaid',
    'RoommateListing',
    'AppliedRoommate',
    'AppliedToHost',
    'BookedRoommate',
    'HouseRentListing',
    'HouseRentImage',
    'Contact',
    'MarketplaceListing',
    'SubscriptionPayment',
    'Announcement',
    'Notification',
  ];

  for (const model of requiredModels) {
    assert.ok(db[model], `${model} should be defined`);
  }
});

test('critical tables use UUID primary keys', () => {
  assert.equal(db.User.primaryKeyAttribute, 'UserId');
  assert.equal(db.Tuition.primaryKeyAttribute, 'TuitionId');
  assert.equal(db.Maid.primaryKeyAttribute, 'MaidId');
  assert.equal(db.HouseRentListing.primaryKeyAttribute, 'HouseRentListingId');
});
