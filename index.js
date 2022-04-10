#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Check the entry document exists
let filePath = process.argv[3] || '.';
try {
  const stat = await fs.promises.stat(filePath);
  if (stat.isDirectory()) {
    filePath = path.join(filePath, 'readme.md');
  }

  process.chdir(path.dirname(filePath));
  filePath = path.basename(filePath);
  await fs.promises.access(filePath);
}
catch (error) {
  console.error('Failed to access the file path', filePath);
  console.error(error.message);
  process.exit(1);
}

// Hold a reference to MarkRight that updates if we watch the source code
let markRight;

// Track whether we are currently running to avoid non-deterministic parallel runs
let running = false;

// Run MarkRight unless it is already running and display reason why the run
async function run(event, fileName) {
  if (running) {
    return;
  }

  running = true;
  console.group(fileName, event);
  try {
    await markRight.run(event, fileName);
  }
  catch (error) {
    console.log('Thrown');
    console.error(error);
  }

  console.groupEnd();
  running = false;
}

// Watch source code changes, reload MarkRight and run MarkRight unless running
async function watch(event, fileName) {
  // Load the MarkRight module dynamically with a cache buster to reload it
  const { default: MarkRight } = await import('./MarkRight.js?' + new Date().valueOf());
  markRight = new MarkRight(filePath);
  await run(event, fileName);
}

// Check and act on CLI action argument
const action = process.argv[2] || 'build';
switch (action) {
  case 'build': {
    // Accept the default action
    break;
  }
  case 'watch': {
    // Extract script path and see if it is running within its source code directory
    const url = new URL(import.meta.url);
    const srcDirectoryPath = path.normalize(path.dirname(url.pathname.slice(/* file:/// (triple slash…) */ '/'.length)));
    const cwdDirectoryPath = process.cwd();

    // Watch source code directory if the script is running from within it
    if (cwdDirectoryPath.startsWith(srcDirectoryPath)) {
      console.log('Watching MarkRight');
      fs.watch(srcDirectoryPath, watch);
    }

    // Watch entry document and retry MarkRight
    console.log('Watching', filePath);
    fs.watch(filePath, run);
    break;
  }
  default: {
    console.error(`Invalid action '${action}' passed, expected either 'build' or 'watch'.`);
    process.exit(1);
  }
}

await watch(process.argv[3] || '.', 'MarkRight');
