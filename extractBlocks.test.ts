import { test, expect } from 'bun:test';
import extractBlocks from './extractBlocks';

test(
  'empty text',
  () => expect(extractBlocks('')).toEqual([])
);

test(
  'plain text',
  () => expect(extractBlocks('test')).toEqual([])
);

test(
  'code span line start',
  () => expect(extractBlocks('`test` test')).toEqual([])
);

test(
  'code span line center',
  () => expect(extractBlocks('test `test` test')).toEqual([])
);

test(
  'code span line end',
  () => expect(extractBlocks('test `test`')).toEqual([])
);

test(
  'empty code span line start',
  () => expect(extractBlocks('`` test')).toEqual([])
);

test(
  'empty code span line center',
  () => expect(extractBlocks('test `` test')).toEqual([])
);

test(
  'empty code span line end',
  () => expect(extractBlocks('test ``')).toEqual([])
);

test(
  'code block',
  () => expect(extractBlocks('test\n```\ntest\n```\n')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n'
    }
  ])
);

test(
  'multi-line code block',
  () => expect(extractBlocks('test\n```\ntest\ntest\ntest\n```\n')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\ntest\ntest\n'
    }
  ])
);

test(
  'code block with tag',
  () => expect(extractBlocks('test\n```test\ntest\n```\n')).toEqual([
    {
      tag: 'test',
      meta: '',
      code: 'test\n'
    }
  ])
);

test(
  'code block with tag and meta',
  () => expect(extractBlocks('test\n```test test test\ntest\n```\n')).toEqual([
    {
      tag: 'test',
      meta: 'test test',
      code: 'test\n'
    }
  ])
);

test(
  'almost code block 1',
  () => expect(extractBlocks('test\n`\ntest')).toEqual([])
);

test(
  'almost code block 2',
  () => expect(extractBlocks('test\n``\ntest')).toEqual([])
);

test(
  'unclosed code block',
  () => expect(extractBlocks('test\n```\ntest')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test'
    }
  ])
);

test(
  'unclosed empty code block',
  () => expect(extractBlocks('test\n```')).toEqual([
    {
      tag: '',
      meta: '',
      code: ''
    }
  ])
);

test(
  'almost end code block 1',
  () => expect(extractBlocks('test\n```\ntest\n`\ntest')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n`\ntest'
    }
  ])
);

test(
  'almost end code block 2',
  () => expect(extractBlocks('test\n```\ntest\n``\ntest')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n``\ntest'
    }
  ])
);

test(
  'trailing almost end code block 1',
  () => expect(extractBlocks('test\n```\ntest\n`')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n`'
    }
  ])
);

test(
  'trailing almost end code block 2',
  () => expect(extractBlocks('test\n```\ntest\n``')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n``'
    }
  ])
);

test(
  'leading code block',
  () => expect(extractBlocks('```\ntest\n```\ntest')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n'
    }
  ])
);

test(
  'trailing code block',
  () => expect(extractBlocks('test\n```\ntest\n```')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n'
    }
  ])
);

test(
  'sole code block with eol',
  () => expect(extractBlocks('```\ntest\n```\n')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n'
    }
  ])
);

test(
  'sole code block without eol',
  () => expect(extractBlocks('```\ntest\n```')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n'
    }
  ])
);

test(
  'almost verbatim code block 1',
  () => expect(extractBlocks('test\n~\n```\ntest\n```\n')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n'
    }
  ])
);

test(
  'almost verbatim code block 2',
  () => expect(extractBlocks('test\n~~\n```\ntest\n```\n')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n'
    }
  ])
);

test(
  'verbatim code block',
  () => expect(extractBlocks('test\n~~~\n```\ntest\n```\n')).toEqual([])
);

test(
  'almost verbatim end code block 1',
  () => expect(extractBlocks('test\n~~~\n```\ntest\n```\n~\ntest')).toEqual([])
);

test(
  'almost verbatim end code block 2',
  () => expect(extractBlocks('test\n~~~\n```\ntest\n```\n~~\ntest')).toEqual([])
);

test(
  'verbatim code block leading',
  () => expect(extractBlocks('~~~\n```\ntest\n```\n~~~\ntest')).toEqual([])
);

test(
  'verbatim code block trailing',
  () => expect(extractBlocks('test\n~~~\n```\ntest\n```\n~~~')).toEqual([])
);

test(
  'sole verbatim code block with eol',
  () => expect(extractBlocks('~~~\n```\ntest\n```\n~~~\n')).toEqual([])
);

test(
  'sole verbatim code block without eol',
  () => expect(extractBlocks('~~~\n```\ntest\n```\n~~~')).toEqual([])
);

test(
  'normal, then verbatim, then normal code blocks',
  () => expect(extractBlocks('```\ntest\n```\n~~~\n```\ntest\n```\n~~~\n```\ntest\n```')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n'
    },
    {
      tag: '',
      meta: '',
      code: 'test\n'
    },
  ])
);

test(
  'verbatim, then normal, then verbatim code blocks',
  () => expect(extractBlocks('~~~\n```\ntest\n```\n~~~\n```\ntest\n```\n~~~\n```\ntest\n```\n~~~\n')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n'
    }
  ])
);

test(
  'almost verbatim end code block 1 with multiple code blocks',
  () => expect(extractBlocks('test\n~~~\n```\ntest\n```\n~\n```\ntest\n```\n')).toEqual([])
);

test(
  'almost verbatim end code block 2 with multiple code blocks',
  () => expect(extractBlocks('test\n~~~\n```\ntest\n```\n~~\n```\ntest\n```\n')).toEqual([])
);

test(
  'non-consecutive ticks do not form a code block',
  () => expect(extractBlocks('``\ntest`test')).toEqual([])
);

test(
  'code block with code span',
  () => expect(extractBlocks('test\n`file-name.ext`\n\n```\ntest\n```\n')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n'
    }
  ])
);

test(
  'code block with path',
  () => expect(extractBlocks('test\n`file-name.ext`:\n\n```\ntest\n```\n')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n',
      path: 'file-name.ext'
    }
  ])
);

test(
  'code block with code span without path',
  () => expect(extractBlocks('test\n`file-name.ext`:\ntest\n```\ntest\n```\n')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n'
    }
  ])
);

test(
  'code block with code span and one without',
  () => expect(extractBlocks('test\n`file-name.ext`:\n\n```\ntest\n```\n\n```\ntest\n```\n')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n',
      path: 'file-name.ext'
    },
    {
      tag: '',
      meta: '',
      code: 'test\n'
    }
  ])
);

test(
  'path: external, tag: no, sigil: none',
  () => expect(extractBlocks('test\n`file-name.ext`:\n\n```\ntest\n```\n')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n',
      path: 'file-name.ext'
    }
  ])
);

test(
  'path: external, tag: no, sigil: append',
  () => expect(extractBlocks('test\n`file-name.ext`:\n\n```!\ntest\n```\n')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n',
      path: 'file-name.ext',
      mode: 'append'
    }
  ])
);

test(
  'path: external, tag: no, sigil: match',
  () => expect(extractBlocks('test\n`file-name.ext`:\n\n```?\ntest\n```\n')).toEqual([
    {
      tag: '',
      meta: '',
      code: 'test\n',
      path: 'file-name.ext',
      mode: 'match'
    }
  ])
);

test(
  'path: external, tag: yes, sigil: none, meta: no',
  () => expect(extractBlocks('test\n`file-name.ext`:\n\n```txt\ntest\n```\n')).toEqual([
    {
      tag: 'txt',
      meta: '',
      code: 'test\n',
      path: 'file-name.ext'
    }
  ])
);

test(
  'path: external, tag: yes, sigil: append, meta: no',
  () => expect(extractBlocks('test\n`file-name.ext`:\n\n```txt !\ntest\n```\n')).toEqual([
    {
      tag: 'txt',
      meta: '',
      code: 'test\n',
      path: 'file-name.ext',
      mode: 'append'
    }
  ])
);

test(
  'path: external, tag: yes, sigil: match, meta: no',
  () => expect(extractBlocks('test\n`file-name.ext`:\n\n```txt ?\ntest\n```\n')).toEqual([
    {
      tag: 'txt',
      meta: '',
      code: 'test\n',
      path: 'file-name.ext',
      mode: 'match'
    }
  ])
);

test(
  'path: external, tag: yes, sigil: none, meta: yes',
  () => expect(extractBlocks('test\n`file-name.ext`:\n\n```txt test\ntest\n```\n')).toEqual([
    {
      tag: 'txt',
      meta: 'test',
      code: 'test\n',
      path: 'file-name.ext'
    }
  ])
);

test(
  'path: external, tag: yes, sigil: none, meta: !yes',
  () => expect(extractBlocks('test\n`file-name.ext`:\n\n```txt !test\ntest\n```\n')).toEqual([
    {
      tag: 'txt',
      meta: '!test',
      code: 'test\n',
      path: 'file-name.ext'
    }
  ])
);

test(
  'path: external, tag: yes, sigil: none, meta: ?yes',
  () => expect(extractBlocks('test\n`file-name.ext`:\n\n```txt ?test\ntest\n```\n')).toEqual([
    {
      tag: 'txt',
      meta: '?test',
      code: 'test\n',
      path: 'file-name.ext'
    }
  ])
);

test(
  'path: external, tag: yes, sigil: append, meta: yes',
  () => expect(extractBlocks('test\n`file-name.ext`:\n\n```txt ! test\ntest\n```\n')).toEqual([
    {
      tag: 'txt',
      meta: 'test',
      code: 'test\n',
      path: 'file-name.ext',
      mode: 'append'
    }
  ])
);

test(
  'path: external, tag: yes, sigil: match, meta: yes',
  () => expect(extractBlocks('test\n`file-name.ext`:\n\n```txt ? test\ntest\n```\n')).toEqual([
    {
      tag: 'txt',
      meta: 'test',
      code: 'test\n',
      path: 'file-name.ext',
      mode: 'match'
    }
  ])
);
