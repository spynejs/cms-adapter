const test = require('node:test');
const assert = require('node:assert/strict');
const { StringUtils } = require('../server/src/utils/string-utils');

test('StringUtils should exist', () => {
  assert.equal(typeof StringUtils, 'function', 'StringUtils should be a function');
});

test('should create a timestamp', () => {
  const timestamp = StringUtils.getDateString();
  assert.ok(typeof timestamp === 'string' && timestamp.length > 0, 'Should return a non-empty string');
});
