import util from 'util';
import { exec } from 'child_process';

const execAsync = util.promisify(exec);

export default async function processShellBlock(code: string) {
  // Note that this won't work because Bun Shell can't take arbitrary commands
  //const { stdout, stderr } = await $`${code}`;

  const { stdout, stderr } = await execAsync(code);

  if (stdout) {
    console.log(stdout);
  }

  if (stderr) {
    console.error(stderr);
  }
}
