import exec from './exec.js';

export default async function () {
  const time = await exec('time');

  if (time.exitCode !== 1) {
    throw new Error('Expected time exit code to be 1.');
  }

  if (!time.stdout.startsWith('The current time is:')) {
    throw new Error('Expected time standard output to start with "The current time is:".');
  }

  if (time.stderr !== '') {
    throw new Error('Expected time standard error to be empty.');
  }

  const date = await exec('date');

  if (date.exitCode !== 1) {
    throw new Error('Expected date exit code to be 1.');
  }

  if (!date.stdout.startsWith('The current date is:')) {
    throw new Error('Expected date standard output to start with "The current date is:".');
  }

  if (date.stderr !== '') {
    throw new Error('Expected date standard error to be empty.');
  }

  const ver = await exec('ver');

  if (ver.exitCode !== 0) {
    throw new Error('Expected date exit code to be 0.');
  }

  if (ver.stdout === '') {
    throw new Error('Expected date standard output to be non-empty.');
  }

  if (ver.stderr !== '') {
    throw new Error('Expected date standard error to be empty.');
  }
}
