import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAppUrl } from '../scripts/url.mjs';
test('accepts published HTTPS URL',()=>assert.equal(validateAppUrl('https://abb.example.com'),'https://abb.example.com/'));
for (const value of [undefined,'http://abb.example.com','https://localhost','https://id-preview--abb.lovable.app','https://user:pass@abb.example.com','https://abb.example.com/?token=private']) test(`rejects unsuitable URL: ${value}`,()=>assert.throws(()=>validateAppUrl(value)));
