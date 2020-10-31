#!/usr/bin/env node

import fs from 'fs';
import MarkRight from './MarkRight.js';

void async function () {
  const action = process.argv[2] || 'build';
  let watch = false;
  switch (action) {
    case 'build': {
      // Accept the default action
      break;
    }
    case 'watch': {
      // Turn on the MarkRight watch mode
      watch = true;
      break;
    }
    default: {
      console.error(`Invalid action '${action}' passed, expected either 'build' or 'watch'.`);
      process.exit(1);
    }
  }

  const filePath = process.argv[3] || 'readme.md';
  try {
    await fs.promises.access(filePath);
  }
  catch (error) {
    console.error('Failed to access the file path', filePath);
    console.error(error.message);
    process.exit(1);
  }

  // TODO: Consider hoisting the watch functionality up and out of the class here
  new MarkRight(filePath, watch).run();
}()
