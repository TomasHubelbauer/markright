# MarkRight

[![](https://img.shields.io/github/stars/tomashubelbauer/markright)](https://github.com/TomasHubelbauer/markright/stargazers)
[![](https://img.shields.io/github/issues/TomasHubelbauer/markright)](https://github.com/TomasHubelbauer/markright/stargazers)
[![](https://img.shields.io/github/forks/TomasHubelbauer/markright)](https://github.com/TomasHubelbauer/markright/network/members)
[![](https://img.shields.io/github/license/tomashubelbauer/markright)](license.md)
[![](https://img.shields.io/badge/sponsor-@tomashubelbauer-orange)](https://github.com/sponsors/tomashubelbauer)
[![](https://img.shields.io/github/v/release/tomashubelbauer/markright)](https://github.com/TomasHubelbauer/markright/releases)

**MarkRight** is a tool for didactic literate programming. It scans a MarkDown
document for fenced code blocks and takes action on ones whose info string marks
a MarkRight action:

~~~
```txt hello-world
Hello, world!
```
~~~

This will create a file by the name of `hello-world` with `Hello, world!` for
content.

~~~
```sh
rm hello-world
```
~~~

This will run `rm hello-world` and delete the `hello-world` file as a result.

MarkRight treats a MarkDown document as a single source of truth and lets all of
the other source code base fall out of it, specification and implementation are
forced to remain synchronized and can never diverge.

MarkRight is intended for use with didactic media (tutorials, documentation, …).

See the [`feature-showcase` example](example/feature-showcase) for a rundown of
all MarkRight features.

## Installation

### NPM

`npm i -g tomashubelbauer/markright`

### Executables

Windows, macOS and Linux executables are available in [Releases][releases].

[releases]: https://github.com/TomasHubelbauer/markright/releases/latest

## Usage

- `markright` (`readme.md`)
- `markright build` (`readme.md`)
- `markright build document.md`
- `markright watch` (`readme.md`)
- `markright watch document.md`

## Examples

See the [`example` directory](example) subdirectories for a variety of examples.

To run MarkRight from source against an example in that directory, run
`npm start example/${name}` (`markright watch example/${name}`).

To run all examples, run `./test.ps1` (`markright build` on each example).

## Source Control

The generated content should still be tracked in source control to ensure it is
easily accessibly even without running MarkRight to generate it. This is useful
for source control web UIs and further emphasises the goal of didactic benefit.

## Development

In development, use `npm test` (`node . watch features/feature-showcase`) to run
the feature showcase example which also works as a features test harness.

Use `./test.ps1` (`node . build` on each example in `examples`) to see if all
examples still work as intended. This script is used by the GitHub Actions CI on
each commit.

### Changelog

MarkRight is in WIP mode at the moment. The version is `0.0.0` and a release is
cut for each commit which passes the CI tests. Once MarkRight reaches `1.0`,
semantic versioning will be used instead and releases will be cut with each
version change and will contain a proper changelog.

## Limitations

- MarkRight converts CRLF in file text into LF for easier internal processing
- MarkRight reserves `?` and `!` at the end of file names for action modifiers
- MarkRight reserves `_` as a placeholder file name, won't use `_` name verbatim
- MarkRight can't output `~` and `` ` `` into file names due to MarkDown syntax
  rules (neither is allowed in a fenced code block info string)
- MarkRight's only supported way of referencing/pulling external assets is thru
  the use of scripts (`mv`, `cp`, `curl`, `wget`, whatever other way…)

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

### Add support for taking in changes and turning them to MarkRight instructions

This feature might make the need for Intellisense support a little less urgent:

Author MarkRight and each time a more complex code change is needed to be done
to a generated file, just make it there. MarkRight will have a command to tell
it to pull in the changes made to the generated files as compated to what it
would generate as currently written. Once these changes are gathered, fenced
code blocks from them are appended to the MarkRight document. The most optimal
type of fenced code block (`patch` or `!`) is chosen.

If running in watch mode, MarkRight should  recognize changes made to the
generated files (by the user, not the ones it does while generating them) and
append and update the pending auto-generated appended code blocks as long as
the user keeps changing the generated files. Take them as committed once the
user edits the MarkRight document itself again, at which point a new set of live
fenced code blocks should be generated and kept being refreshed while the user
edits the generated files.

### Fix the `Pkg: Error reading from file.` error using `rcedit` on the binary

When using this in the CI to apply an icon to the Windows executable:

```
curl -L https://github.com/electron/rcedit/releases/latest/download/rcedit-x64.exe -o rcedit.exe
./rcedit markright-win.exe --set-icon icon.ico
```

I get the above error while running the executable. Before applying the icon,
the executable works just fine.

### Catch `stdin` expectation in scripts where possible and probably error on it

If a process spawned as a result of MarkRight encountering a script block is
trying to read from `stdin`, detect that and throw an error. There is no useful
way MarkRight could provide to the `stdin` other than piping its own `stdin` in,
but I don't want MarkRight to be interactive this way. Instead, users should use
code blocks to generated files expected by the process they ran so it doesn't
need to ask for anything at `stdin`.

https://stackoverflow.com/q/64670110/2715716

### Fix changes in the document picked out by the watcher resulting in empty run

Here and there after the initial `npm test` run, when the `readme.me` is changed
and the `watch` picks it up, the only line printed is `Processed readme.md`, but
none of the code-blocks have actually run.
