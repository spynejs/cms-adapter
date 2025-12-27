const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('ramda');
const { SnapshotsData } = require('./mocks/snapshot-data-mocks');
const snapshotsDataOrig = R.clone(SnapshotsData);
const { SnapshotsContainerView } = require('../server/dom-renders/snapshots-container-view');

test('SnapshotsContainerView should exist', () => {
  assert.equal(typeof SnapshotsContainerView, 'function', 'SnapshotsContainerView should be a function');
});

test('should create a list item for SnapshotsContainerView', () => {
  const { currentSnapshots } = SnapshotsData[0];
  const snapshotItem = currentSnapshots[0];
  const snapshotListItem = SnapshotsContainerView.createSnapshotItem(snapshotItem);

  assert.equal(typeof snapshotListItem, 'string', 'createSnapshotItem should return a string');
});

test('should create an unordered list from snapshot array', () => {
  const { currentSnapshots } = SnapshotsData[0];
  const snapshotsUl = SnapshotsContainerView.createSnapshotUnorderedList(currentSnapshots);

  assert.equal(typeof snapshotsUl, 'string', 'createSnapshotUnorderedList should return a string');
});

test('should map snapshots data to DOM items', () => {
  const snapshotsDomItemsArr = SnapshotsContainerView.mapSnapshotsDataToDomItems(snapshotsDataOrig);
  assert.ok(Array.isArray(snapshotsDomItemsArr), 'should return an array');
  assert.equal(snapshotsDomItemsArr.length, 2, 'array length should be 2');
});
