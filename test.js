import fs from 'fs';
import path from 'path';
import MarkRight from './MarkRight.js';

// Use by running `npm test` or `npm test ${regex}` to filter only given tests
void async function () {
  const filePath = import.meta.url.slice('file:///'.length);
  const directoryPath = path.dirname(filePath);

  // Run JavaScript tests
  for (const fileName of await fs.promises.readdir(directoryPath)) {
    if (!fileName.endsWith('.test.js')) {
      continue;
    }

    if (process.argv[2] && !fileName.match(process.argv[2])) {
      continue;
    }

    try {
      const { default: test } = await import('file://' + path.join(directoryPath, fileName));
      await test();
    }
    catch (error) {
      console.log(fileName, error);
    }
  }

  // Skip MarkDown tests when filtering for a given JavaScript test
  if (process.argv[2]) {
    return;
  }

  // Run MarkDown tests
  for (const directoryName of await fs.promises.readdir(path.join(directoryPath, 'example'))) {
    process.chdir(path.join(directoryPath, 'example', directoryName));
    const markRight = new MarkRight(path.join(directoryPath, 'example', directoryName, 'readme.md'));
    try {
      // TODO: Check this matches the expected snapshot by checking no files Git-changed
      await markRight.run();
    }
    catch (error) {
      console.log(directoryName, error);
    }
  }

  // TODO: Get rid of this once we figure out how to prevent `node-wsb` from dangling
  process.exit(0);
}()
