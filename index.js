import fs from 'fs';
import child_process from 'child_process';
import util from 'util';

const shells = ['sh', 'bash', 'batch', 'posh', 'powershell'];
const streams = ['stdout', 'stderr'];
const edits = ['diff', 'patch'];

void async function () {
  const buffer = await fs.promises.readFile('sample.md');
  const text = buffer.toString('utf-8');
  const lines = text.split('\n');

  // Track the current fenced code block or be `undefined` if we are not in one
  let code;

  // Track file names found so far so that we can tell decide to create or edit
  const files = new Set();

  // Track the current shell script stdout, stderr and exit code
  let stdout;
  let stderr;
  let exitCode;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    // Enter or exit a code block as we encounter fenced code block demarcators
    if (line.startsWith('```')) {
      // Handle exiting a fenced code block
      if (code) {
        const text = code.text.join('\n') + '\n';

        const [lang, fileName, _, ...infoText] = code.infoText.split(' ');
        if (infoText.length > 0) {
          throw new Error('Too many arguments in the info text, at most use three');
        }

        // Use the file name from the info text if we do not have one already
        if (fileName) {
          if (code.fileName) {
            throw new Error('Redundant info text file name atop preceeding standalone inline code run file name.');
          }
          
          code.fileName = fileName;
        }

        let action;

        // Designate the code block text for creating or updating file text
        // Use backticks (disallowed in info text) to avoid clash with info text
        if (code.fileName) {
          // Designate the code block text for appending to the file text
          if (files.has(code.fileName)) {
            action = '`appendFile`';
          }

          // Designate the code block for creating/editing/replacing of the file
          else {
            action = '`writeFile`';
            files.add(code.fileName);
          }

          // Override the action to a file content check as opposted to a write
          if (_ === '?') {
            action = '`readFile`';
          }
        }

        // Designate the code block for script execution/stream comparison/edit
        if (shells.includes(lang) || streams.includes(lang) || edits.includes(lang)) {
          // Override and focus the action even if already given by file name
          action = lang;
        }

        if (action) {
          switch (action) {
            // Execute the shell script
            // TODO: Support running in the given shell of all the supported shells
            case 'sh': {
              try {
                const process = await util.promisify(child_process.exec)(text);
                stdout = process.stdout;
                stderr = process.stderr;
                exitCode = 0;
              }
              catch (error) {
                stdout = error.stdout;
                stderr = error.stderr;
                exitCode = error.exitCode;
              }

              console.log('Executed shell script');
              break;
            }

            // Compare expected and actual stdout of the last shell script
            // TODO: Ensure the exit code is 0
            case 'stdout': {
              if (stdout === undefined) {
                throw new Error('No shell script has been run yet.');
              }

              compare(stdout, text, 'stdout');
              console.log('Verified stdout match');
              break;
            }

            // Compare expected and actual stderr of the last shell script
            // TODO: Ensure the exit code matches `stderr #` if provided
            case 'stderr': {
              if (stderr === undefined) {
                throw new Error('No shell script has been run yet.');
              }

              compare(stderr, text, 'stderr');
              console.log('Verified stderr match');
              break;
            }

            // Create a new file with the text
            case '`writeFile`': {
              await fs.promises.writeFile(code.fileName, text);
              console.log('Created', code.fileName);
              break;
            }

            // Append text to the existing file
            case '`appendFile`': {
              await fs.promises.appendFile(code.fileName, text);
              console.log('Appended to', code.fileName);
              break;
            }

            case '`readFile`': {
              const buffer = await fs.promises.readFile(code.fileName);
              compare(buffer.toString('utf-8') + '\n', text, 'file');
              console.log('Verified', code.fileName, 'text match');
              break;
            }

            // Edit the file based on the provided diff/patch
            // TODO: Implement this generally, right now only clear is supported
            case 'diff': case 'patch': {
              if ('- ' + await fs.promises.readFile(code.fileName, 'utf-8') !== text) {
                throw new Error('TODO: Implement general diff/patch');
              }

              // Clear the file
              await fs.promises.truncate(code.fileName);
              console.log('Truncated', code.fileName);
              break;
            }

            default: {
              throw new Error(`Unimplemented action '${action}'.`);
            }
          }
        }
        else {
          throw new Error('No action determined for the code block');
        }

        console.log('\tInfo text:', code.infoText);
        console.log('\tCode text:', preview(text));

        code = undefined;
      }

      // Handle entering a fenced code block
      else {
        const infoText = line.substring('```'.length);
        code = { infoText, text: [] };

        // Extract the standalone code span preceeding the code block text
        if (index > 0) {
          const line = lines[index - 1];
          if (line.startsWith('`') && line.endsWith('`')) {
            code.fileName = line.slice('`'.length, -'`'.length);
          }
        }
      }
    }
    else if (code) {
      code.text.push(line);
    }
  }
}()

const threshold = 80;

function preview(/** @type {string} */ text) {
  const lines = text.match(/\n/g)?.length || 0;
  const chars = text.length;
  return `${JSON.stringify(text.slice(0, threshold))}${chars > threshold ? '…' : ''} (${lines} lines, ${chars} chars)`;
}

function compare(actual, expected, title) {
  if (actual === expected) {
    return;
  }

  console.log('Actual:  ', preview(actual));
  console.log('Expected:', preview(expected));
  console.error('Text does not match ' + title);
  process.exit(1);
}
