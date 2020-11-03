# MarkRight

[![](https://img.shields.io/github/stars/tomashubelbauer/markright)](https://github.com/TomasHubelbauer/markright/stargazers)
[![](https://img.shields.io/github/issues/TomasHubelbauer/markright)](https://github.com/TomasHubelbauer/markright/stargazers)
[![](https://img.shields.io/github/forks/TomasHubelbauer/markright)](https://github.com/TomasHubelbauer/markright/network/members)
[![](https://img.shields.io/github/license/tomashubelbauer/markright)](license.md)
[![](https://img.shields.io/badge/sponsor-@tomashubelbauer-orange)](https://github.com/sponsors/tomashubelbauer)
[![](https://img.shields.io/github/v/release/tomashubelbauer/markright)](https://github.com/TomasHubelbauer/markright/releases)

**MarkRight** is a tool for didactic literate programming.

It works by processing a MarkDown file to manage files and run commands based on
its contents in order to (re)produce a program from literate programming source.

## Installation

### NPM

`npm i -g tomashubelbauer/markright`

### Executables

**Windows**, **macOS** and **Linux** executables are available in
[Releases](https://github.com/TomasHubelbauer/markright/releases/latest).

## Usage

- `markright` to build `readme.md`
- `markright build` to build `readme.md`
- `markright build document.md` to build `document.md`
- `markright watch` to watch `readme.md`
- `markright watch document.md` to watch `document.md`

## Example

See the [`example`](example) directory. To run MarkRight from source against an
example in that directory, run `npm start example/${name}`.

To run all examples, run `./test.ps1`.

## Features

See the [`feature-showcase`](example/feature-showcase) example for a rundown of
MarkRight features. Run with `npm test` or `npm start example/feature-showcase`.

## Purpose

MarkRight provides a solution for literate programming with focus on didactics,
which is particularly well served by the fact that the generated content from
the MarkRight document is overriden each time MarkRight is run which forces the
document to be a single source of truth and thus always up-to-date. This
prevents tutorial/documentation/specification from driftinf/staling compated to
the implementation.

The generated content should still be tracked in source control to ensure it is
easily accessibly even without running MarkRight to generate it. This is useful
for source control web UIs and further emphasises the goal of didactic benefit.

## Inspiration

MarkRight is inspired by the concept lab notebooks (lab notes), and later by the
concept of computer science notebooks we see in data science today.

## Limitations

- MarkRight converts CRLF in file text into LF for easier internal processing
- MarkRight reserves `?` and `!` at the end of file names for action modifiers
- MarkRight reserves `_` as a placeholder file name, won't use `_` name verbatim
- MarkRight can't output `~` and `` ` `` into file names due to MarkDown syntax
  rules (neither is allowed in a fenced code block info string)
- MarkRight's only supported way of referencing/pulling external assets is thru
  the use of scripts (`mv`, `cp`, `curl`, `wget`, whatever other way…)

## Support

This program is maintained and is of a WIP level of quality and support.

## License

MarkRight is licensed under the terms of the [AGPL 3.0only](license.md) license.

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

### Support mixed `+` and `-` in patch and support unchanged lines in patch

Unchanged lines in patch will make detecting patch from insert/append harder but
it should still be possible to detect: all lines either start with a sign symbol
or are present in the file verbatim [in case of unchanged lines] in the correct,
patch, order.

### Add a command for appending a code block for the change made in the files

This way MarkRight editor support can way by leveraging editing generated files
and automatically carrying in the changes in their most optimal form.

### Fix the `Pkg: Error reading from file.` error using `rcedit` on the binary

When using this in the CI to apply an icon to the Windows executable:

```
curl -L https://github.com/electron/rcedit/releases/latest/download/rcedit-x64.exe -o rcedit.exe
./rcedit markright-win.exe --set-icon icon.ico
```

I get the above error while running the executable. Before applying the icon,
the executable works just fine.

### Catch `stdin` expectation in scripts where possible and probably error on it

### Fix changes in the document picked out by the watcher resulting in empty run

Here and there after the initial `npm test` run, when the `readme.me` is changed
and the `watch` picks it up, the only line printed is `Processed readme.md`, but
none of the code-blocks have actually run.
