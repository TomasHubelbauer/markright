import fs from 'fs';

const changes = {
  'package.json': {
    [`"type": "module",`]: ``,
  },
  'index.js': {
    [`import fs from 'fs';`]: `const fs = require('fs');`,
    [`import path from 'path';`]: `const path = require('path');`,
    [`const { default: MarkRight } = await import('./MarkRight.js?' + new Date().valueOf());`]: `const MarkRight = require('./MarkRight');`,
    [`const url = new URL(import.meta.url);`]: `const url = new URL(__filename);`,
  },
  'MarkRight.js': {
    [`import fs from 'fs';`]: `const fs = require('fs');`,
    [`import os from 'os';`]: `const os = require('os');`,
    [`import path from 'path';`]: `const path = require('path');`,
    [`import util from 'util';`]: `const util = require('util');`,
    [`import child_process from 'child_process';`]: `const child_process = require('child_process');`,
    [`export default`]: `module.exports =`,
  },
};

void async function () {
  for (const fileName in changes) {
    console.group(fileName);
    let text = await fs.promises.readFile(fileName, 'utf-8');

    for (const change in changes[fileName]) {
      console.log(change);
      text = text.replace(change, changes[fileName][change]);
    }

    console.groupEnd();
    await fs.promises.writeFile(fileName, text);
  }
}()
