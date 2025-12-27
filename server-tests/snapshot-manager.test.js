const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fse = require('fs-extra');
const R = require('ramda');

const dataPath = path.join(__dirname, '../src/static/data/');
const testMainFileName = 'proxy-test-data.json';
const snapshotsDir = path.resolve('server/.snapshots/');
const { ProxyTestData, snapshotArrayToSort } = require('./mocks/proxy-test-data');
const { SnapshotsManager } = require('../server/src/snapshots-manager');

// ────────────────────────────────────────────────
//  Test: SnapshotsManager existence
// ────────────────────────────────────────────────
test('SnapshotsManager should exist', () => {
  assert.equal(typeof SnapshotsManager, 'function', 'SnapshotsManager should be a function');
});

// ────────────────────────────────────────────────
//  Test: listSnapshots async behavior
// ────────────────────────────────────────────────
test('SnapshotsManager.listSnapshots should resolve with a list', async () => {
  const snapshotsManager = new SnapshotsManager();

  const snapshotsList = await snapshotsManager.listSnapshots(testMainFileName);

  // basic validation
  assert.ok(Array.isArray(snapshotsList), 'listSnapshots should return an array');
  assert.ok(
      snapshotsList.length >= 0,
      'listSnapshots should return at least an empty array'
  );

  // optional: check element structure if applicable
  if (snapshotsList.length > 0) {
    const item = snapshotsList[0];
    assert.ok(typeof item === 'string' || typeof item === 'object', 'list items should be strings or objects');
  }
});
