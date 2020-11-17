import exec from './exec.js';
import assert from 'assert';

export default async function () {
  const time = await exec('time', 'cmd');
  assert.match(time.stdout, /^The current time is: .*?\r\nEnter the new time: $/);
  assert.strictEqual(time.stderr, '');
  assert.strictEqual(time.exitCode, 1);

  const date = await exec('date', 'cmd');
  assert.match(date.stdout, /^The current date is: .*? \r\nEnter the new date: \(mm-dd-yy\) $/);
  assert.strictEqual(date.stderr, '');
  assert.strictEqual(date.exitCode, 1);

  const ver = await exec('ver', 'cmd');
  assert.notStrictEqual(ver.stdout, '');
  assert.strictEqual(ver.stderr, '');
  assert.strictEqual(ver.exitCode, 0);
}
