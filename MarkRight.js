import fs from 'fs';
import os from 'os';
import path from 'path';
import util from 'util';
import child_process from 'child_process';

export default class MarkRight {
  constructor(/** @type {string} */ filePath) {
    this.filePath = filePath;

    // The special markers allowed at the end of file name to do special actions
    this.markers = ['?', '+', '-', '±'];

    // The length of text to preview when printing actual/expected comparisons
    this.threshold = 80;
  }

  async run() {
    let text = await fs.promises.readFile(this.filePath, 'utf-8');

    // Normalize CRLF to LF to simplify the regular expression for code blocks
    text = text.replace(/\r\n/g, '\n');

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
          this.exit(`No arguments must be used in info text in edit mode.`);
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
    // Resolve the `_` file name placeholder to the last known file name
    if (fileName === '_' || this.markers.includes(fileName) || this.markers.map(marker => '_' + marker).includes(fileName)) {
      if (!this.fileName) {
        this.exit('Cannot use the file name placeholder before naming a file.');
      }

      // Preserve the file name suffix if any:
      // - If underscore, leave it out
      // - If standalone marker, append it
      // - If underscore with marker, append only the marker
      fileName = this.fileName + (fileName === '_' ? '' : (fileName[1] || fileName[0]));
    }

    if (fileName.endsWith('?')) {
      this.fileName = fileName.slice(0, -'?'.length);
      return this.file_compare(this.fileName, text);
    }

    if (fileName.endsWith('+')) {
      this.fileName = fileName.slice(0, -'+'.length);
      return this.file_append(this.fileName, text);
    }

    if (fileName.endsWith('-')) {
      this.fileName = fileName.slice(0, -'-'.length);
      return this.file_insert(this.fileName, text);
    }

    if (fileName.endsWith('±')) {
      this.fileName = fileName.slice(0, -'±'.length);
      return this.file_patch(this.fileName, text);
    }

    this.fileName = fileName;
    try {
      await fs.promises.access(fileName);
      return this.file_replace(fileName, text);
    }
    catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }

      return this.file_create(fileName, text);
    }
  }

  async file_compare(/** @type {string} */ fileName, /** @type {string} */ text) {
    this.compare(await fs.promises.readFile(fileName, 'utf-8'), text, 'file');
    console.log('Verified', fileName, 'match');
  }

  async file_append(/** @type {string} */ fileName, /** @type {string} */ text) {
    await fs.promises.appendFile(fileName, text);
    console.log('Appended to', fileName);
  }

  async file_insert(/** @type {string} */ fileName, /** @type {string} */ text) {
    const fileText = await fs.promises.readFile(fileName, 'utf-8');
    const fileLines = fileText.split('\n');
    const textLines = text.split('\n');

    // Remove the empty line at the end
    textLines.pop();

    const startCandidate = this.findStart(fileLines, textLines);
    const endCandidate = this.findEnd(fileLines, textLines);

    // Replace the identified portion
    fileLines.splice(startCandidate.index, endCandidate.index - startCandidate.index, ...textLines);
    await fs.promises.writeFile(fileName, fileLines.join('\n'));
    console.log('Inserted into', fileName);
  }

  async file_create(/** @type {string} */ fileName, /** @type {string} */ text) {
    await fs.promises.writeFile(fileName, text);
    console.log('Created', fileName);
  }

  async file_replace(/** @type {string} */ fileName, /** @type {string} */ text) {
    await fs.promises.writeFile(fileName, text);
    console.log('Replaced', fileName);
  }

  // TODO: Support mixed + and - lines and unchanged lines
  async file_patch(/** @type {string} */ fileName, /** @type {string} */ changes) {
    const text = await fs.promises.readFile(fileName, 'utf-8');
    const fileLines = text.split('\n');
    const textLines = changes.split('\n');
    textLines.pop();

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
      this.exit('The changes are not a set of removals followed by a set of additions.');
    }

    const positionCandidate = this.findStart(fileLines, deletionLines);
    fileLines.splice(positionCandidate.index, positionCandidate.length, ...additionLines);
    await fs.promises.writeFile(fileName, fileLines.join('\n'));
    console.log('Patched', fileName);
  }

  // TODO: Add support for running in a specific shell (sh, bash, posh, …)
  async run_sh(/** @type {string} */ _, /** @type {string} */ text) {
    if (_) {
      this.exit('Shell script can have no argument.');
    }

    // TODO: Use an OS-appropriate shell here
    if (/\n[^$]/.test(text)) {
      const tempPath = path.join(os.tmpdir(), 'markright.ps1');
      await fs.promises.writeFile(tempPath, text);
      text = 'powershell ' + tempPath;
    }

    try {
      const process = await util.promisify(child_process.exec)(text);
      this.stdout = process.stdout;
      this.stderr = process.stderr;
      this.exitCode = 0;
    }
    catch (error) {
      this.stdout = error.stdout;
      this.stderr = error.stderr;
      this.exitCode = error.code;
    }

    console.log('Executed shell script');
  }

  async run_stdout(/** @type {string} */ _, /** @type {string} */ text) {
    if (_) {
      this.exit('Stdout check can have no argument.');
    }

    if (this.exitCode === undefined) {
      this.exit('Cannot check process stream before running a script!', 1);
    }

    if (this.exitCode !== 0) {
      console.error(this.stderr);
      this.exit('Exit code is not zero.');
    }

    this.compare(this.stdout, text, 'stdout');
    console.log('Verified stdout match');
  }

  async run_stderr(/** @type {string} */ code, /** @type {string} */ text) {
    const exitCode = code === undefined ? undefined : Number(code);
    if (Number.isNaN(exitCode)) {
      this.exit('Stderr check argument must be a number if present.');
    }

    if (this.exitCode === undefined) {
      this.exit('Cannot check process stream before running a script!', 1);
    }

    if (code !== undefined && this.exitCode !== exitCode) {
      console.error(this.stderr);
      this.exit(`Exit code is not ${exitCode}.`);
    }

    this.compare(this.stderr, text, 'stderr');
    console.log('Verified stderr match');
  }

  async run_patch(/** @type {string} */ fileName, /** @type {string} */ text) {
    await this.file(fileName + '±', text);
  }

  async run_diff(/** @type {string} */ fileName, /** @type {string} */ text) {
    await this.file(fileName + '±', text);
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

    // TODO: Treat this as prepending to the file instead of failing
    if (startCandidates.length === 0) {
      this.exit('No start candidates found');
    }

    // TODO: Select the last start candidate instead to ensure no conflict within
    if (startCandidates.length > 1) {
      this.exit('Multiple start candidates found.');
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

    // TODO: Treat this as appending to the file instead of failing
    if (endCandidates.length === 0) {
      this.exit('No end candidates found');
    }

    // TODO: Select the first start candidate instead to ensure no conflict within
    if (endCandidates.length > 1) {
      this.exit('Multiple end candidates found.');
    }

    const [endCandidate] = endCandidates;
    return endCandidate;
  }

  exit(/** @type {string} */ message, /** @type {number} */ code = 1) {
    console.error(message);
    process.exit(code);
  }

  compare(/** @type {string} */ actual, /** @type {string} */ expected, /** @type {string} */ title) {
    actual = actual.replace(/\r\n/g, '\n');
    if (actual === expected) {
      return;
    }

    console.log('Actual:  ', this.preview(actual));
    console.log('Expected:', this.preview(expected));
    this.exit('Text does not match ' + title, 1);
  }

  preview(/** @type {string} */ text) {
    return `${JSON.stringify(text.slice(0, this.threshold))}${text.length > this.threshold ? '…' : ''} (${text.match(/\n/g)?.length || 0} lines, ${text.length} chars)`;
  }
}
