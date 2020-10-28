#!/usr/bin/env node

import MarkRight from './MarkRight.js';

void async function () {
  new MarkRight(process.argv[2] || 'readme.md').run();
}()
