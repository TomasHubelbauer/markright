# MarkRight

MarkRight is a tool for didactic literate programming.

It works by scanning a MarkDown files for fenced code blocks adorned with extra
instructions and acting on those instructions to execute code, create files etc.

The artifact of the MarkRight document exection might be a file, a program or a
process that has happened and left desirable side effects.

MarkRight documents are primarily append-only capturing new changes to apply to
the existing instructions and their artifacts.

## Examples

By default, MarkRight will ignore code blocks which lack a language tag or whose
language tag it doesn't have support for.

A code block like this will have no effect:

~~~
```
Hello, world!
```
~~~

MarkRight will exit with empty output upon executing such a document.

The most basic example of a MarkRight document that would give output would be
this document where the code block has the special `stdout` language tag:

~~~
```stdout
Hello, world!
```
~~~

Run `markright demo/stdout/readme.md` or `markright demo/stdout` to execute this
example.

The `stdout` language tag instructs MarkRight to dump the code block's text to
the standard output stream of the MarkRight process.

`stderr` is supported with analoguous behavior for the standard error stream and
there is a respective example of this in `demo/stderr`.
The standard error lines appear in red and you can verify they are in stderr by
splitting the I/O streams and writing them into respective files:
`markright demo/stderr 2>> error 1>> output`.

See [Handlers](#handlers) for the list of supported language tag handlers.

Another similar example would be the JavaScript Hello World expression one in
`demo/javascript-expression` which demonstrates that JavaScript code blocks that
produce output redirect their output to MarkRight's output stream.

See also `demo/javascript-exception` to see the special-cased behavior of
exceptions getting written to the standard error stream.

Note that by default MarkRight looks for a `readme.md` file in the current
directory.

MarkRight code blocks can also create and update files.
To create a file, prepend a code span with the file name suffixed by a colon
atop the code block it relates to with nothing but whitespace in between:

~~~
`file-name.ext`:

```
Hello, world!
```
~~~

This code block's text will get written to `file-name.ext` even though it has no
language tag, because it have an associated path.
If there was a language tag, its handler's standard streams would get redirected
to the file.

## Handlers

### `txt`

Alias for the `stdout` language tag.
Useful for forcing the code block to be included in the output which it wouldn't
without a language tag.
Shorter than `stdout` and without the `stdout`/`stderr` parity baggage if only
the former is used in the document.
Implied when the code block has an associated path even if it has no language
tag.

### `stdout`

Writes the code block's text to the MarkRight's standard output I/O stream.

### `stderr`

Writes the code block's text to the MarkRight's standard error I/O stream.

### `js` / `javascript`

Evaluates the code block as JavaScript using Bun's `eval` function.
Writes the output of the last expression, if any, to standard output, unless an
exception was thrown, in which case it gets written to standard error.

Note that this handler uses `eval` and as such does not support `async`/`await`.
See https://github.com/oven-sh/bun/issues/14873 for more information.

Note that JSX is not supported.

### `ts` / `typescript`

Transpiles the provided TypeScript code to JavaScript using Bun's transpiler and
executes it using the JavaScript handler.

Note that TLS and JSX is not supported, see the JavaScript handler section for
more information.

Note that Bun doesn't support evaluating TypeScript directly yet, see here:
https://github.com/oven-sh/bun/issues/11976

## Development

Run tests using `bun test`.
Use `.only` to work on individual tests.

Run using `bun .` to run on `readme.md` or `bun . /directory/file.md` to run on
a non-default document.

## To-Do

### Return GitHub Actions workflow and its corresponding readme badge

- Use Bun GitHub Actions support
- Run the unit tests
- Run Bun's bundler to product executables for all platforms
- Bump `package.json` version using `bun version patch` if supported
- Stage the `package.json` Git change
- Use `jq` to query the new version
- Use `actions/create-release` to create a new release with the version
- Use `actions/upload-release-asset` to upload the platform executables
- Commit and push the `package.json` change

### Distribute to JSR or maybe even NPM as an executable package

Do this in a Bun-friendly way, something easy, not a PITA.

### Add a `--watch` command to keep watching the file for changes

Clear the terminal in between runs.

### Improve the parser to not require duplicating mode sigils with inline path

Currently `tag ..file-name.ext` is needed to specify a tag and the inline path
while also distinguishing it from the meta.

Doing it this way simplifies the parser implementation but makes for a worse
user experience.
It is a worthwhile trade-off for now, but should be improved down the line.

One option to solve this would be to require the paths to start with a period
like in ESM path module specifiers, but I don't like that option too much.

### Add unit tests for the demo files

Create a wrapper to catch `console.log` and `console.error` calls like I already
do in `processBlocks` and compare the expected output with the real output.

In file management demos, also check the files on disk and clean up after.

### Find a way to allow `diff`/`patch` code blocks to not have hunk context line

The `@@` line.
The `patch` utility seems to require these, it will not try to match and patch
loosely.
The `git apply` command has `--unidiff-zero` which seems to allow not providing
the context lines but it was giving me trouble probably because the file I am
trying to apply to is not necessarily tracked by Git?

If there is no way to get rid of these, maybe I could generate the hunk context
by assuming the changes are for the whole file?
This would massively lessen the utility of this code block though.
Maybe there is a path where I derive the start and end lines and only require
that the diff/patch code is a single hunk maybe?

### Consider allowing to specify what shell to use in the shell handler

Support the `bash`, `zsh` etc. language tags and take the choice of the shell
into an account in the execution.

Add examples that showcase the various shell's features to prove they shell
selection works.

### Return support for the Windows Sandbox feature

Run PowerShell scripts in the Windows Sandbox and get back their outputs.
Also maybe file manage in the Windows Sandbox?

### Recover the CLI calculator example and reimplement it in Bun

Once I have the file management sigils and operations figured out, I should be
able to reimplement that example in MarkRight again with the new version running
on Bun to showcase the features it uses.

https://raw.githubusercontent.com/TomasHubelbauer/markright/4fbead6a0b5a769d3ab04f1e3cb0c91b82df0e00/example/node-cli-calculator/readme.md

### Add support for leaving out `diff`/`patch` meta and the `_` sigil

When multiple code blocks in a row operate on the same file, it would be a pain
to keep repeating its name, so let's make these two changes:

1. Add the `_` sigil to code blocks without external path which makes the block
   inherit the path of the last block that had a path
2. Allow the `diff` and `patch` blocks to not specify `meta` in which case the
   path of the last block that had a path is used

### Add a subcommand to take in the difference between the file and the document

When the user goes and runs the document, then changes the files, make this new
subcommand determine the differences between what is there and what MarkRight
had generated and add the diffs at the end of the document.

### Make a VS Code extension for automatically colleting MarkRight changes

This is related to the above task about bringing in diffs after user made edits
to the artifacts MarkRight dropped.
Make it possible to just work on files and have the MarkRight document be built
for you with the possibility to jump in and add your comments as needed.

### Consider adding a new file management sigil to tee to file and terminal both

This could be useful?
