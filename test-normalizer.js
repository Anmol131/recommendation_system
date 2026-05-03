/**
 * Quick test for typeNormalizer utility
 * Run this with: node test-normalizer.js
 */

import { normalizeType, typeToPluralLabel, typeToLabel } from './frontend/src/utils/typeNormalizer.js';

const testCases = [
  // normalizeType tests
  { input: 'all', expected: '', fn: 'normalizeType' },
  { input: 'movies', expected: 'movie', fn: 'normalizeType' },
  { input: 'movie', expected: 'movie', fn: 'normalizeType' },
  { input: 'books', expected: 'book', fn: 'normalizeType' },
  { input: 'book', expected: 'book', fn: 'normalizeType' },
  { input: 'music', expected: 'music', fn: 'normalizeType' },
  { input: 'musics', expected: 'music', fn: 'normalizeType' },
  { input: 'games', expected: 'game', fn: 'normalizeType' },
  { input: 'game', expected: 'game', fn: 'normalizeType' },
  { input: '', expected: '', fn: 'normalizeType' },
  
  // typeToPluralLabel tests
  { input: 'movie', expected: 'movies', fn: 'typeToPluralLabel' },
  { input: 'book', expected: 'books', fn: 'typeToPluralLabel' },
  { input: 'music', expected: 'music', fn: 'typeToPluralLabel' },
  { input: 'game', expected: 'games', fn: 'typeToPluralLabel' },
  { input: '', expected: 'all', fn: 'typeToPluralLabel' },
  
  // typeToLabel tests
  { input: 'movie', expected: 'Movie', fn: 'typeToLabel' },
  { input: 'book', expected: 'Book', fn: 'typeToLabel' },
  { input: 'music', expected: 'Music', fn: 'typeToLabel' },
  { input: 'game', expected: 'Game', fn: 'typeToLabel' },
];

const fnMap = {
  normalizeType,
  typeToPluralLabel,
  typeToLabel,
};

let passed = 0;
let failed = 0;

testCases.forEach((test) => {
  const fn = fnMap[test.fn];
  const result = fn(test.input);
  const isPass = result === test.expected;
  
  if (isPass) {
    passed++;
    console.log(`✓ ${test.fn}("${test.input}") = "${result}"`);
  } else {
    failed++;
    console.log(`✗ ${test.fn}("${test.input}") = "${result}" (expected "${test.expected}")`);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
