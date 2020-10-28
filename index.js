#!/usr/bin/env node

import MarkRight from './MarkRight.js';

void async function () {
  const watch = process.argv[3] === '--watch';
  new MarkRight(process.argv[2] || 'readme.md', watch).run();
}()
