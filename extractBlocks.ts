import type { Block } from './Block';

export default function extractBlocks(text: string) {
  let line = 1;
  let column = 1;
  let state:
    | 'line-start'
    | 'line'
    | 'block-tick-1'
    | 'block-tick-2'
    | 'block-tick-3'
    | 'path'
    | 'path-end'
    | 'block-tag'
    | 'block-meta-or-mode'
    | 'block-meta-after-mode'
    | 'block-meta'
    | 'code-line-start'
    | 'code-line'
    | 'block-end-tick-1'
    | 'block-end-tick-2'
    | 'block-end-tick-3'
    | 'verbatim-block-tick-1'
    | 'verbatim-block-tick-2'
    /* Note `verbatim-block-tick-3` has no special behavior, isn't needed */
    | 'verbatim-block-end-tick-1'
    | 'verbatim-block-end-tick-2'
    /* Note `verbatim-block-end-tick-3` has no special behavior, isn't needed */
    = 'line-start'
    ;

  let tag = '';
  let meta = '';
  let code = '';
  let path = '';
  let mode: undefined | 'create' | 'append' | 'match';
  let verbatim = false;
  const blocks: Block[] = [];
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    //console.log(`${line}:${column} ${JSON.stringify(character)}`);

    const _state = state;
    switch (state) {
      case 'line-start': {
        switch (character) {
          case '`': {
            state = 'block-tick-1';
            break;
          }
          case '\n': {
            break;
          }
          case '~': {
            if (verbatim) {
              state = 'verbatim-block-end-tick-1';
            }
            else {
              state = 'verbatim-block-tick-1';
            }

            break;
          }
          default: {
            // Clear `path` if there is anything but white-space between the code span and the code block
            path = '';
            state = 'line';
            break;
          }
        }

        break;
      }
      case 'line': {
        switch (character) {
          case '\n': {
            state = 'line-start';
            break;
          }
        }

        break;
      }
      case 'block-tick-1': {
        switch (character) {
          case '`': {
            state = 'block-tick-2';
            break;
          }
          case 'a': case 'b': case 'c': case 'd': case 'e': case 'f': case 'g': case 'h': case 'i': case 'j': case 'k': case 'l': case 'm': case 'n': case 'o': case 'p': case 'q': case 'r': case 's': case 't': case 'u': case 'v': case 'w': case 'x': case 'y': case 'z':
          case 'A': case 'B': case 'C': case 'D': case 'E': case 'F': case 'G': case 'H': case 'I': case 'J': case 'K': case 'L': case 'M': case 'N': case 'O': case 'P': case 'Q': case 'R': case 'S': case 'T': case 'U': case 'V': case 'W': case 'X': case 'Y': case 'Z':
          case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
          case '/': case '\\': case '.': case '-': case '_': {
            path = character;
            state = 'path';
            break;
          }
          default: {
            state = 'line';
            break;
          }
        }

        break;
      }
      case 'block-tick-2': {
        switch (character) {
          case '`': {
            state = 'block-tick-3';
            break;
          }
          default: {
            state = 'line';
            break;
          }
        }

        break;
      }
      case 'block-tick-3': {
        switch (character) {
          case 'a': case 'b': case 'c': case 'd': case 'e': case 'f': case 'g': case 'h': case 'i': case 'j': case 'k': case 'l': case 'm': case 'n': case 'o': case 'p': case 'q': case 'r': case 's': case 't': case 'u': case 'v': case 'w': case 'x': case 'y': case 'z':
          case 'A': case 'B': case 'C': case 'D': case 'E': case 'F': case 'G': case 'H': case 'I': case 'J': case 'K': case 'L': case 'M': case 'N': case 'O': case 'P': case 'Q': case 'R': case 'S': case 'T': case 'U': case 'V': case 'W': case 'X': case 'Y': case 'Z':
          case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': {
            tag += character;
            state = 'block-tag';
            break;
          }
          case '!': {
            mode = 'append';
            state = 'block-meta';
            break;
          }
          case '?': {
            mode = 'match';
            state = 'block-meta';
            break;
          }
          case '\n': {
            state = 'code-line-start';
            break;
          }
        }

        break;
      }
      case 'path': {
        switch (character) {
          case 'a': case 'b': case 'c': case 'd': case 'e': case 'f': case 'g': case 'h': case 'i': case 'j': case 'k': case 'l': case 'm': case 'n': case 'o': case 'p': case 'q': case 'r': case 's': case 't': case 'u': case 'v': case 'w': case 'x': case 'y': case 'z':
          case 'A': case 'B': case 'C': case 'D': case 'E': case 'F': case 'G': case 'H': case 'I': case 'J': case 'K': case 'L': case 'M': case 'N': case 'O': case 'P': case 'Q': case 'R': case 'S': case 'T': case 'U': case 'V': case 'W': case 'X': case 'Y': case 'Z':
          case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
          case '/': case '\\': case '.': case '-': case '_': {
            path += character;
            break;
          }
          case '`': {
            state = 'path-end';
            break;
          }
          default: {
            state = 'line';
            break;
          }
        }

        break;
      }
      case 'path-end': {
        switch (character) {
          case ':': {
            state = 'line';
            break;
          }
          default: {
            path = '';
            state = 'line';
            break;
          }
        }

        break;
      }
      case 'block-tag': {
        switch (character) {
          case 'a': case 'b': case 'c': case 'd': case 'e': case 'f': case 'g': case 'h': case 'i': case 'j': case 'k': case 'l': case 'm': case 'n': case 'o': case 'p': case 'q': case 'r': case 's': case 't': case 'u': case 'v': case 'w': case 'x': case 'y': case 'z':
          case 'A': case 'B': case 'C': case 'D': case 'E': case 'F': case 'G': case 'H': case 'I': case 'J': case 'K': case 'L': case 'M': case 'N': case 'O': case 'P': case 'Q': case 'R': case 'S': case 'T': case 'U': case 'V': case 'W': case 'X': case 'Y': case 'Z':
          case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': {
            tag += character;
            break;
          }
          case ' ': {
            state = 'block-meta-or-mode';
            break;
          }
          case '\n': {
            state = 'code-line-start';
            break;
          }
        }

        break;
      }
      case 'block-meta-or-mode': {
        switch (character) {
          case '\n': {
            state = 'code-line-start';
            break;
          }
          case '!': {
            mode = 'append';
            state = 'block-meta-after-mode';
            break;
          }
          case '?': {
            mode = 'match';
            state = 'block-meta-after-mode';
            break;
          }
          default: {
            meta += character;
            state = 'block-meta';
            break;
          }
        }

        break;
      }
      case 'block-meta-after-mode': {
        switch (character) {
          case '\n': {
            state = 'code-line-start';
            break;
          }
          case ' ': {
            state = 'block-meta';
            break;
          }
          default: {
            switch (mode) {
              case 'append': {
                meta += '!';
                break;
              }
              case 'match': {
                meta += '?';
                break;
              }
            }

            meta += character;
            mode = undefined;
            state = 'block-meta';
            break;
          }
        }

        break;
      }
      case 'block-meta': {
        switch (character) {
          case '\n': {
            state = 'code-line-start';
            break;
          }
          default: {
            meta += character;
            break;
          }
        }

        break;
      }
      case 'code-line-start': {
        switch (character) {
          case '`': {
            state = 'block-end-tick-1';
            break;
          }
          case '\n': {
            code += character;
            break;
          }
          default: {
            code += character;
            state = 'code-line';
            break;
          }
        }

        break;
      }
      case 'code-line': {
        switch (character) {
          case '\n': {
            code += character;
            state = 'code-line-start';
            break;
          }
          default: {
            code += character;
            break;
          }
        }

        break;
      }
      case 'block-end-tick-1': {
        switch (character) {
          case '`': {
            state = 'block-end-tick-2';
            break;
          }
          default: {
            code += '`' + character;
            state = 'code-line';
            break;
          }
        }

        break;
      }
      case 'block-end-tick-2': {
        switch (character) {
          case '`': {
            state = 'block-end-tick-3';
            break;
          }
          default: {
            code += '``' + character;
            state = 'code-line';
            break;
          }
        }

        break;
      }
      case 'block-end-tick-3': {
        switch (character) {
          case '\n': {
            if (!verbatim) {
              const block: Block = { tag, meta, code };

              if (path) {
                block.path = path;
              }

              if (mode) {
                block.mode = mode;
              }

              blocks.push(block);
            }

            tag = '';
            meta = '';
            code = '';
            path = '';
            mode = undefined;
            state = 'line-start';
            break;
          }
        }

        break;
      }
      case 'verbatim-block-tick-1': {
        switch (character) {
          case '~': {
            state = 'verbatim-block-tick-2';
            break;
          }
          case '\n': {
            state = 'line-start';
            break;
          }
          default: {
            state = 'line';
            break;
          }
        }

        break;
      }
      case 'verbatim-block-tick-2': {
        switch (character) {
          case '~': {
            verbatim = true;
            state = 'line';
            break;
          }
          case '\n': {
            state = 'line-start';
            break;
          }
          default: {
            state = 'line';
            break;
          }
        }

        break;
      }
      case 'verbatim-block-end-tick-1': {
        switch (character) {
          case '~': {
            state = 'verbatim-block-end-tick-2';
            break;
          }
          case '\n': {
            state = 'line-start';
            break;
          }
          default: {
            state = 'line';
            break;
          }
        }

        break;
      }
      case 'verbatim-block-end-tick-2': {
        switch (character) {
          case '~': {
            verbatim = false;
            state = 'line';
            break;
          }
          case '\n': {
            state = 'line-start';
            break;
          }
          default: {
            state = 'line';
            break;
          }
        }

        break;
      }
      default: {
        throw new Error(`Unexpected character ${JSON.stringify(character)} in state ${JSON.stringify(state)} on line ${line}, column ${column}!`);
      }
    }

    if (state !== _state) {
      //console.log(`${line}:${column} ${JSON.stringify(character)} transitioned ${JSON.stringify(_state)} to ${JSON.stringify(state)}`);
    }

    if (character === '\n') {
      line++;
      column = 1;
    }
    else {
      column++;
    }
  }

  switch (state) {
    case 'line-start':
    case 'line':
    case 'block-tick-1':
    case 'block-tick-2': {
      break;
    }
    case 'block-tick-3':
    case 'code-line-start':
    case 'code-line':
    case 'block-end-tick-3': {
      if (!verbatim) {
        const block: Block = { tag, meta, code };

        if (path) {
          block.path = path;
        }

        if (mode) {
          block.mode = mode;
        }

        blocks.push(block);
      }

      break;
    }
    case 'block-end-tick-1': {
      code += '`';
      if (!verbatim) {
        const block: Block = { tag, meta, code };

        if (path) {
          block.path = path;
        }

        if (mode) {
          block.mode = mode;
        }

        blocks.push(block);
      }

      break;
    }
    case 'block-end-tick-2': {
      code += '``';
      if (!verbatim) {
        const block: Block = { tag, meta, code };

        if (path) {
          block.path = path;
        }

        if (mode) {
          block.mode = mode;
        }

        blocks.push(block);
      }

      break;
    }
    default: {
      throw new Error(`Unexpected end of file in state ${JSON.stringify(state)} on line ${line}, column ${column}!`);
    }
  }

  return blocks;
}
