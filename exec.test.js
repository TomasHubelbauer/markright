import exec from './exec.js';

void async function () {
  console.log(await exec('time'));
  console.log(await exec('date'));
  console.log(await exec('ver'));
}()
