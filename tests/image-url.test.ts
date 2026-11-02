import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeImageUrl, pickImage, flipProtocol } from '../src/services/imageUrl';
const HOST = 'http://srv.example:8080';
test('görsel adresleri temizlenir ve göreli yollar sağlayıcıya göre çözülür', () => {
  assert.equal(normalizeImageUrl('http://a.com/x y.jpg'), 'http://a.com/x%20y.jpg');
  assert.equal(normalizeImageUrl('http:\\/\\/a.com\\/x.jpg'), 'http://a.com/x.jpg');
  assert.equal(normalizeImageUrl('//cdn.a.com/x.jpg'), 'http://cdn.a.com/x.jpg');
  assert.equal(normalizeImageUrl('/img/x.jpg', HOST), `${HOST}/img/x.jpg`);
  assert.equal(normalizeImageUrl('img/x.jpg', HOST), `${HOST}/img/x.jpg`);
  assert.equal(normalizeImageUrl('/img/x.jpg'), undefined);
});
test('boş / null değerler elenir; ilk geçerli aday seçilir', () => {
  for (const empty of ['', ' ', 'null', 'undefined', null, undefined, 0, []]) assert.equal(normalizeImageUrl(empty), undefined);
  assert.equal(normalizeImageUrl(['', 'https://b.com/a.png']), 'https://b.com/a.png');
  assert.equal(pickImage(HOST, '', null, ['https://c.com/1.jpg', 'x']), 'https://c.com/1.jpg');
});
test('http ve https arasında geçiş yapılır', () => {
  assert.equal(flipProtocol('http://a.com/x'), 'https://a.com/x');
  assert.equal(flipProtocol('https://a.com/x'), 'http://a.com/x');
  assert.equal(flipProtocol('/brand/x.svg'), undefined);
});
