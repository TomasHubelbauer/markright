import Bun from 'bun';
import extractBlocks from './extractBlocks';
import processBlocks from './processBlocks';

const arg = process.argv[2];
const filePath = arg ? (/.md$/i.test(arg) ? arg : `${arg}/readme.md`) : 'readme.md';
const directoryPath = filePath.slice(0, filePath.lastIndexOf('/'));
const file = Bun.file(filePath);
if (await file.exists()) {
  const text = await file.text();
  const blocks = extractBlocks(text);
  try {
    if (directoryPath) {
      process.chdir(directoryPath);
    }

    await processBlocks(blocks);
  }
  catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);

    // Note that `console.error` will write to `stderr` but won't set exit code 1.
    process.exit(1);
  }
}
else {
  console.error(`File not found: ${filePath}`);

  // Note that `console.error` will write to `stderr` but won't set exit code 1.
  process.exit(1);
}
