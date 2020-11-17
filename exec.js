import child_process from 'child_process';
import stream from 'stream';

export default async function exec(/** @type {string} */ command, /** @type {string} */ shell = 'powershell') {
  const process = child_process.exec(command, { shell });

  // Reply to process prompts with nothing to shut the prompts down and error
  /** @this {process.Readable} */
  function read(/** @type {number} */ _size) {
    // TODO: Consider reporting the number of attempts and sizes with the result
    this.push(null);
  }

  // Make the process use the shut-down stdio stream to avoid hanging on prompts
  new stream.Readable({ read }).pipe(process.stdin);

  // TODO: Figure out why `for await (const buffer of process.stdout)` won't work
  let stdout = '';
  process.stdout.on('data', chunk => stdout += chunk);

  // TODO: Figure out why `for await (const buffer of process.stderr)` won't work
  let stderr = '';
  process.stderr.on('data', chunk => stderr += chunk);

  const exitCode = await new Promise((resolve, reject) => {
    process.on('exit', resolve);
    process.on('error', reject);
  });

  return { exitCode, stdout, stderr };
}
