import fs from 'fs';
import util from 'util';
import child_process from 'child_process';

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

        await this.edit(fileName, codeText);
      }

      // Execute the code block if there is a language and argument in info text
      else if (language) {
        const handler = this['exec_' + language];

        // Handle language specific processing (shell scripts, stream comparison)
        if (handler) {
          await handler.bind(this)(argument, codeText);
        }

        // Edit (create/update) or compare based on a file name in argument
        else if (argument) {
          await this.edit(argument, codeText);
        }
      }
    }
  }

  async edit(/** @type {string} */ fileName, /** @type {string} */ text) {
    // Compare text if the `?` flag tails the file name
    if (fileName.endsWith('?')) {
      fileName = fileName.slice(0, -'?'.length);
      this.compare(await fs.promises.readFile(fileName, 'utf-8'), text, 'file');
      console.log('Verified', fileName, 'match');
      return;
    }

    if (fileName.endsWith('+')) {
      fileName = fileName.slice(0, -'+'.length);
      await fs.promises.appendFile(fileName, text);
      console.log('Appended to', fileName);
      return;
    }

    if (fileName.endsWith('-')) {
      fileName = fileName.slice(0, -'+'.length);
      this.exit('Inserting into a file using contextual lines is not implemented yet');
    }

    try {
      await fs.promises.access(fileName);
      await fs.promises.writeFile(fileName, text);
      console.log('Replaced', fileName);
    }
    catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }

      await fs.promises.writeFile(fileName, text);
      console.log('Created', fileName);
    }
  }

  // TODO: Add support for running in a specific shell (sh, bash, posh, …)
  async exec_sh(/** @type {string} */ _, /** @type {string} */ text) {
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

  async exec_stdout(/** @type {string} */ _, /** @type {string} */ text) {
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

  async exec_stderr(/** @type {string} */ code, /** @type {string} */ text) {
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
  async exec_patch(/** @type {string} */ fileName, /** @type {string} */ text) {
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
