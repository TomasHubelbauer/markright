import fs from 'fs';
import exec from './exec.js';
import wsb from './node-wsb/index.js';
import assert from 'assert';

export default class MarkRight {
  constructor(/** @type {string} */ filePath) {
    this.filePath = filePath;
  }

  async run() {
    let text = await fs.promises.readFile(this.filePath, 'utf-8');

    // Normalize CRLF to LF to simplify the regular expression for code blocks
    text = text.replace(/\r\n/g, '\n');

    // Remove verbatim code blocks to avoid interpreting fenced code blocks within
    text = text.replace(/(^|\n)~~~\n(.*?\n)*?~~~(\n|$)/g, '');

    // Math fenced code blocks
    // - (^|\n) to ensure starting with line or with the start of text
    // - (`(?<fileName>.*?)`\n)? to capture optional associated inline code run
    // - (?<infoText>.*?)\n to capture optional info text of the code block
    // - (?<codeText>(.*?\n)*?) to capture all code block lines as a single text
    // - (\n|$) to ensure ending with line or with the end of text
    const regex = /(^|\n)(`(?<fileName>.*?)`\n)?```(?<infoText>.*?)\n(?<codeText>(.*?\n)*?)```(\n|$)/g;

    /** @type {RegExpExecArray} */
    let match;
    while (match = regex.exec(text)) {
      const { fileName, infoText, codeText } = match.groups;
      const { language, argument } = infoText.match(/^(?<language>.*?)( (?<argument>.*?))?$/).groups;

      // Edit (create/update) a file when an associated inline code run exists
      if (fileName) {
        if (argument) {
          throw new Error(`No arguments must be used in info text in edit mode.`);
        }

        await this.file(fileName, codeText);
      }

      // Execute the code block if there is a language and argument in info text
      else if (language) {
        const handler = this['run_' + language];

        // Handle language specific processing (shell scripts, stream comparison)
        if (handler) {
          await handler.bind(this)(argument, codeText);
        }

        // Edit (create/update) or compare based on a file name in argument
        else {
          // Fall back to `language` if no `argument`, e.g. info text `?`
          await this.file(argument || language, codeText);
        }
      }
    }

    console.log('Processed', this.filePath);
  }

  async file(/** @type {string} */ fileName, /** @type {string} */ text) {
    // Recognize action modifier (question or exclamation mark) in file name
    /** @type {undefined | 'match' | 'patch'} */
    let action;
    switch (fileName[fileName.length - 1]) {
      case '?': {
        action = 'match';
        fileName = fileName.slice(0, -1) || '_';
        break;
      }
      case '!': {
        action = 'patch';
        fileName = fileName.slice(0, -1) || '_';
        break;
      }
    }

    // Preserve file name if the `_` placeholder is used otherwise update it
    if (fileName === '_') {
      if (!this.fileName) {
        throw new Error('Cannot use the file name placeholder before naming a file.');
      }
    }
    else {
      this.fileName = fileName;
    }

    /** @type {undefined | string} */
    let fileText;
    try {
      fileText = await fs.promises.readFile(this.fileName, 'utf-8');
    }
    catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Math the file  text against the code block text
    if (action === 'match') {
      if (fileText === undefined) {
        throw new Error('Cannot match file which does not exist!');
      }

      this.file_match(fileText, text);
      return;
    }

    // Patch the text to write prior to writing it
    if (action === 'patch') {
      text = this.file_patch(fileText || '', text);
    }

    await fs.promises.writeFile(this.fileName, text);
    const message = fileText === undefined ? 'Created' : (action === 'patch' ? 'Patched' : 'Replaced');
    console.log(message, this.fileName);
  }

  file_match(/** @type {string} */ fileText, /** @type {string} */ text) {
    this.compare(fileText, text);
    console.log('Matched', this.fileName);
  }

  file_patch(/** @type {string} */ fileText, /** @type {string} */ text) {
    const fileLines = fileText.split('\n');
    const textLines = text.split('\n');
    textLines.pop();

    // TODO: Support mixed + and - lines and unchanged lines
    if (textLines.every(line => line.startsWith('+ ') || line.startsWith('- '))) {
      const deletionLines = [];
      for (let index = 0; index < textLines.length; index++) {
        const line = textLines[index];
        if (line.startsWith('- ')) {
          deletionLines.push(line.slice('- '.length));
        }
        else {
          break;
        }
      }

      const additionLines = [];
      for (let index = textLines.length - 1; index > 0; index--) {
        const line = textLines[index];
        if (line.startsWith('+ ')) {
          additionLines.unshift(line.slice('+ '.length));
        }
        else {
          break;
        }
      }

      if (deletionLines.length + additionLines.length !== textLines.length) {
        throw new Error('The changes are not a set of removals followed by a set of additions.');
      }

      const positionCandidate = this.findStart(fileLines, deletionLines);
      if (positionCandidate === undefined) {
        throw new Error('No position candidate was found.');
      }

      fileLines.splice(positionCandidate.index, positionCandidate.length, ...additionLines);
      return fileLines.join('\n');
    }

    const startCandidate = this.findStart(fileLines, textLines);
    const endCandidate = this.findEnd(fileLines, textLines);

    if (startCandidate === undefined && endCandidate === undefined) {
      return fileText + text;
    }

    if (startCandidate === undefined || endCandidate === undefined) {
      console.log('TODO');
    }

    fileLines.splice(startCandidate.index, endCandidate.index - startCandidate.index, ...textLines);
    return fileLines.join('\n');
  }

  // TODO: Add support for running in a given shell (sh, bash, posh, …) thru `_`
  async run_sh(/** @type {string} */ _, /** @type {string} */ text) {
    const data = _ ? JSON.parse(_) : {};

    // TODO: Use an OS-appropriate shell instead of always PowerShell
    this.stdio = await exec(text, 'powershell');

    // TODO: Implement titling blocks or preview the script content for a title
    console.log('Executed shell script');

    if (data.stdout) {
      await this.run_stdout('', data.stdout);
    }

    if (data.stderr) {
      await this.run_stdout(data.exitCode, data.stderr);
    }
  }

  async run_stdout(/** @type {string} */ _, /** @type {string} */ text) {
    if (_) {
      throw new Error('Stdout check can have no argument.');
    }

    if (this.stdio === undefined) {
      throw new Error('Cannot check process stream before running a script!');
    }

    if (this.stdio.exitCode !== 0) {
      console.error(this.stdio.stderr);
      throw new Error('Exit code is not zero.');
    }

    this.compare(this.stdio.stdout, text);
    console.log('Verified stdout match');
  }

  async run_stderr(/** @type {string} */ code, /** @type {string} */ text) {
    const exitCode = code === undefined ? undefined : Number(code);
    if (Number.isNaN(exitCode)) {
      throw new Error('Stderr check argument must be a number if present.');
    }

    if (this.stdio === undefined) {
      throw new Error('Cannot check process stream before running a script!');
    }

    if (code !== undefined && this.stdio.exitCode !== exitCode) {
      console.error(this.stdio.stderr);
      throw new Error(`Exit code is not ${exitCode}.`);
    }

    this.compare(this.stdio.stderr, text);
    console.log('Verified stderr match');
  }

  // TODO: Make this an option of PowerShell script block instead of its own
  async run_wsb(/** @type {string} */ _, /** @type {string} */ text) {
    if (_) {
      throw new Error('Windows Sandbox script can have no argument.');
    }

    // TODO: Detect WSB unavailable by checking for it instead of the CI/CD flag
    // TODO: Change this to call `run_posh` to ensure correct shell is used (PS)
    // Run in PowerShell in case Windows Sandbox is detected unavailable
    if (process.env.CI) {
      await this.run_sh('', text);
      return;
    }

    // TODO: Download Node and mount and run source version if source watch mode
    // TODO: Download binary for the correct platform or maybe mount host binary
    // (this would ensure that sandbox MR is the same version as host MR)
    this.stdio = await wsb(text);

    // TODO: Implement titling blocks or preview the script content for a title
    console.log('Executed sandbox script');
  }

  async run_patch(/** @type {string} */ fileName, /** @type {string} */ text) {
    await this.file(fileName + '!', text);
  }

  async run_diff(/** @type {string} */ fileName, /** @type {string} */ text) {
    await this.file(fileName + '!', text);
  }

  findStart(/** @type {string[]} */ fileLines, /** @type {string[]} */ textLines) {
    const startCandidates = [];
    for (let fileIndex = 0; fileIndex < fileLines.length; fileIndex++) {
      const candidate = { index: fileIndex, length: 0 };
      for (let textIndex = 0; textIndex < textLines.length; textIndex++) {
        const fileLine = fileLines[fileIndex + textIndex];
        const textLine = textLines[textIndex];
        if (textLine === fileLine) {
          candidate.length++;
        }
        else {
          break;
        }
      }

      if (candidate.length > 0) {
        startCandidates.push(candidate);
      }
    }

    // TODO: Select the last start candidate instead to ensure no conflict within
    if (startCandidates.length > 1) {
      throw new Error('Multiple start candidates found.');
    }

    const [startCandidate] = startCandidates;
    return startCandidate;
  }

  findEnd(/** @type {string[]} */ fileLines, /** @type {string[]} */ textLines) {
    const endCandidates = [];
    for (let fileIndex = fileLines.length - 1; fileIndex > 0; fileIndex--) {
      const candidate = { index: fileIndex, length: 0 };
      for (let textIndex = textLines.length - 1; textIndex > 0; textIndex--) {
        const fileLine = fileLines[fileIndex - (textLines.length - textIndex)];
        const textLine = textLines[textIndex];
        if (textLine === fileLine) {
          candidate.length++;
        }
        else {
          break;
        }
      }

      if (candidate.length > 0) {
        endCandidates.push(candidate);
      }
    }

    // TODO: Select the first end candidate instead to ensure no conflict within
    if (endCandidates.length > 1) {
      throw new Error('Multiple end candidates found.');
    }

    const [endCandidate] = endCandidates;
    return endCandidate;
  }

  compare(/** @type {string} */ actual, /** @type {string} */ expected) {
    assert.strictEqual(actual.replace(/\r\n/g, '\n'), expected);
  }
}
