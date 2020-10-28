import fs from 'fs';
import util from 'util';
import child_process from 'child_process';
import { start } from 'repl';

export default class MarkRight {
  constructor(/** @type {string} */ filePath) {
    this.filePath = filePath;

    // The length of text to preview when printing actual/expected comparisons
    this.threshold = 80;
  }

  async run() {
    const text = await fs.promises.readFile(this.filePath, 'utf-8');

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
        else if (argument) {
          await this.file(argument, codeText);
        }
      }
    }
  }

  async file(/** @type {string} */ fileName, /** @type {string} */ text) {
    if (fileName.endsWith('?')) {
      return this.file_compare(fileName.slice(0, -'?'.length), text);
    }

    if (fileName.endsWith('+')) {
      return this.file_append(fileName.slice(0, -'+'.length), text);
    }

    if (fileName.endsWith('-')) {
      return this.file_insert(fileName.slice(0, -'-'.length), text);
    }

    try {
      await fs.promises.access(fileName);
      return this.file_replace(fileName, text);
    }
    catch (error) {
      if (error.code !== 'EEXIST') {
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

    // Find all start candidates
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

    // Find all end candidates
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

  // TODO: Add support for running in a specific shell (sh, bash, posh, …)
  async run_sh(/** @type {string} */ _, /** @type {string} */ text) {
    if (_) {
      this.exit('Shell script can have no argument.');
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

    this.compare(this.stdout, text, 'stdout');
    if (this.exitCode !== 0) {
      this.exit('Exit code is not zero.');
    }

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

    this.compare(this.stderr, text, 'stderr');
    if (this.exitCode !== exitCode) {
      this.exit(`Exit code is not ${exitCode}.`);
    }

    console.log('Verified stderr match');
  }

  // TODO: Do a more general update (supporting + and - lines, maybe more)
  // TODO: Pull this out and alias to both `diff` and `patch`
  async run_patch(/** @type {string} */ fileName, /** @type {string} */ text) {
    try {
      await fs.promises.access(fileName);
    }
    catch (error) {
      this.exit('Patch argument must be an existing file name.');
    }

    if (text !== '- ' + await fs.promises.readFile(fileName, 'utf-8')) {
      this.exit('Only file clear (truncate) patch is supported at the moment.');
    }

    await fs.promises.truncate(fileName);
    console.log('Truncated', fileName);
  }

  exit(/** @type {string} */ message, /** @type {number} */ code = 1) {
    console.error(message);
    process.exit(code);
  }

  compare(/** @type {string} */ actual, /** @type {string} */ expected, /** @type {string} */ title) {
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
