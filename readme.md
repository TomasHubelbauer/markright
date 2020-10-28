# MarkRight

![![](https://img.shields.io/github/stars/tomashubelbauer/markright)](![](https://img.shields.io/github/stars/tomashubelbauer/markright))
![![](https://img.shields.io/github/issues/TomasHubelbauer/markright)](![](https://img.shields.io/github/issues/tomashubelbauer/markright))
![![](https://img.shields.io/github/forks/TomasHubelbauer/markright)](![](https://img.shields.io/github/forks/tomashubelbauer/markright))
![![](https://img.shields.io/github/license/tomashubelbauer/markright)](license.md)
![![](https://img.shields.io/badge/sponsor-@tomashubelbauer-orange)](https://github.com/sponsors/tomashubelbauer)

MarkRight is a literate programming tool.

## Status

This program is maintained and is of a WIP level of quality and support.

## Installation

`npm i -g tomashubelbauer/markright`

## Usage

`markright` (`readme.md`) or `markright document.md`

## License

[AGPL](license.md)

## Example

For a full example, see the `test` directory, which contains `readme.md` which
implements a simple Node calculator using JavaScript. To run it, run `markright`
in the `test` directory or use `npm test` to install MarkRight from the latest
source globally and then run the latest binary on `test/readme.md`.

Since this document is written in MarkDown, it itself is a valid MarkRight
document, however it produces no generated content.

## Purpose

MarkRight works by reading a MarkDown document and interpreting its fenced code
blocks which it determines should result in some action (create or update file,
run shell script, verify stdout/stderr of the last script, verify text content
of the given file, …). These actions are used to build up a codebase.

MarkRight is intended for educational projects, where it is of utmost importance
that the documentation material and the code base remain in sync. It should not
be used for anything where this benefit is not important, as it will result in
poor experience otherwise.

The content generated by MarkRight, while deterministically generatable just by
running MarkRight on the entry document, should still be tracked in version
control so that the codebase is easily accessible even without MarkRight and can
be viewed and studied just by using an editor and no other tools. However, using
an editor to edit the generated files is discouraged and futile as they will be
regenerated the next time MarkRight is run.

## Inspiration

MarkRight is inspired by notebooks, specifically lab notebooks, but also the
computer science notebooks we know today.

## Features

MarkRight is capable of recognizing several patterns of fenced code block info
texts in a MarkDown file. These patterns allow you to instruct MarkRight to run
actions which enable building up files and executing scripts as per the document
resulting in literal programming experience where just by describing the program
you are building, you are building the program.

### Create a file

~~~
`name.txt`
```
content
```
~~~

This will create or replace `name.txt` with `content` for its text content.

### Run a script

~~~
```sh
node index.js
```
~~~

### Delete a file

Use the script running fenced code block and run `rm file.ext`.

### Append to a file

~~~
```txt name.txt+
more content
```
~~~

The `+` sign is used to distinguish from creating (or overwriting) a file and
appending at the end of a file.

### Insert into a file

~~~
```txt name.txt-
content
inserted content
more content
```
~~~

The leading and trailing lines are used to determine where in the file to place
the lines between them.

### Create a file without showing its name

~~~
```txt new-name.txt
content
```
~~~

This is alternative syntax for the one based on placing an inline code run with
the file name atop the fenced code block.

### Patch a file

~~~
```patch name.txt
- inserted content
+ patched content
```
~~~

Line starting with `-` are removed, lines starting with `+` are added and lines
that start with neither are unchanged and checked for being the same.

### Verify file content

~~~
```txt name.txt?
content
patched content
more content
```
~~~

This will verify that the given file has given content.

### File name tracking

Everywhere where a file name is accepted, `_` can be passed in. It will resolve
to the last file name used, making the difference between editing a single file
in multiple steps and jumping between various files more pronounced so that the
difference is easy to spot. Also, changing file names does not require multiple
edits this way.

On top of this, if they file name has a MarkRight directive suffix (?, +, -, ±),
you can leave out even the underscore and just use the directive standalone. MR
will know to restore the last known file name in this case, too.

## Considerations

There are unsolved problems, such as the exact syntax of the code blocks or how
to reference external assets being pulled into the project, but these problems
are not too pressing, as MarkRight should be useful even before these are solved
(if they ever are).

## Limitations

MarkRight places several limitations on the MarkDown being used as well as the
names of the files being generated:

- MarkRight syntax might conflict with info text not inteded for MarkRight
  (this is extremely unlikely due to the specific MarkRight syntax but possible)
- MarkRight reserves some symbols at the end of file names for special actions
  - `?` indicates the file text should be checked against the excepcted text
  - `+` indicates the code block text is to be appended not to replace the file
  - `-` indicates the code block text is to be interpolated not to replace file
  - `±` indicates the code block text is a patch to be appled to the file text
  - `_` is a placeholder for the last file name and cannot be used as file name
  - Some operating systems allows some of these symbols in file names bur MR not
- MarkRight can not output `` ` `` and `~` into a file name using the info text
  as these symbols are disallowed in MarkDown fenced code block info text
  (this can be worked around using the alternative inline code run syntax)
- MarkRight does not support newlines other than `\n` (so, not `\r\n`), we may
  support these in the future, but as of now it has not been a priority

## Development

Use `test/readme.md` for test MarkRight content and run MarkRight from source on
it by running `npm test` which places MarkRight into the global scope by doing
`npm link` and then runs this fresh binary in `test`. MarkRight defaults to
`readme.md` if no file name is given, so `test/readme.md` will be run.

You can use `npm run watch` which uses Nodemon to watch MarkRight source code
and MarkDown files.

## To-Do

### Address code to-do comments

### Cache the unchanged layers

Do not run the whole document each time, recognize the changed part (usually the
very end) and run only the part that has changed.

### Think about VS Code Intellisense support

This one is going to be very tricky… For each code block, we need to determine
the full content of the file it relates to (because it might be a patch block)
and use that code to fuel the Intellisense for the given language.

Remains to be seen if this is going to even be possible using the VS Code API.

It might also be necessary to either store the texts in temporary files or use
the generated files and only "translate" the cursor in the code block to the
backing content in the generated file so that things like modules work (VS Code
knows what to suggest for module paths etc.).

### Consider adding support for `~~~` to be able to output MarkDown code blocks

Right now MarkDown can be output using MarkRight, but code blocks can't because
they need to be escaped in code blocks that MarkRight recognizes using `~~~`.

### Consider allowing shell code blocks to check streams in info string

Instead of following each shell code block with `stdout` and `stderr`, add an
option to specify the expected stdout and stderr in the shell code block info
string. This way we can still test the streams and exit code, but we can do it
non-visually too, for cases where that's more appropriate. E.g.:

~~~
```sh 0 "Hello, world!"
node .
```
~~~

This will check stdout for the given text and also stderr for emptiness.

~~~
```sh 1 "No argument provided"
node .
```
~~~

This will check stderr for the given text and also stdout for emptiness.

Maybe this could be allowed, too:

~~~
```sh 1 "Argument count: 0" "No argument provided"
node .
```
~~~

To check both stdout and stderr at the same time.

And maybe it could be allowed to pass in regular expressions instead in case
things like file names, dates or random numbers are involved. This could also
enable multi-line checks which while they should really go into their own stream
check block, could be done in the shell script block too.

### Consider allowing regex pre-processing in stream check blocks

This would be useful for normalizing things like file system  paths, dates and
random numbers in the output. E.g.:

~~~
```stdout \d+ g {random number}
Your random number is: {random number}.
```
~~~

### Consider consolidating `-` and `±` markers into just `±` (and maybe `+` too)

Right now `-` and `±` work differently so two symbols are used, but we could try
and differentiate based on the patch text. If it is a contextual patch where
either leading or trailing (or both) lines are used to determine the patch
placement within the file, there won't be any lines starting with `+` or `-`. If
there are any, it most likely means this is a regular patch. For now we do not
support unchanged lines in patches, so for now we could have 100 % confidence by
checking if all lines are either `+` or `-` lines. Later if we decide to support
unchanged lines in patches, there will be room for false positives, but it may
be sufficiently small that it won't be a problem in practice.

We might even be able to get away with merging `+` marker with these too, by
defaulting to appending where to placement has been determined by contextual
lines and the changes are not a patch.
