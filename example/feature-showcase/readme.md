# Feature Showcase

MarkRight is capable of recognizing several patterns of fenced code block info
texts in a MarkDown file. These patterns allow you to instruct MarkRight to run
actions which enable building up files and executing scripts as per the document
resulting in literal programming experience where just by describing the program
you are building, you are building the program.

## Create or replace a file

`test`
```
Test
```

`test` (relative to `readme.md`) will be created or replaced depending on if it
already existed.

## Run a script

To run any arbitrary (even multi-line) script, use a `sh` fenced code block:

```sh
echo Script test > test
```

### Check file content

```?
Script test 
```

The `test` file will be checked to see if it really contains the same content as
typed in the MarkDown fenced code block. This is useful to ensure the executed
scripts provide the expected outputs and will work as a unit test.

### Delete a file

```sh
del test
```

### Append to a file

This will append to a file if one already exists or create a file if it doesn't:

```!
More content
```

The file did not exist, before we deleted it using a script, so it got made.

```!
Even more content
```

This time the file did exist, so content got appended to it. Now it says:

```?
More content
Even more content
```

The `!` sign is used to distinguish from creating (or overwriting) a file and
appending at the end of a file.

### Track file name

Everywhere where a file name is accepted, `_` can be passed in. It will resolve
to the last file name used, making the difference between editing a single file
in multiple steps and jumping between various files more pronounced so that the
difference is easy to spot. Also, changing file names does not require multiple
edits this way.

`?` can be used in place of `_?` (match last file) and `_!` (patch last file),
you don't need to use the placeholder and can leave these modifiers standalone.

An example with even more appending, but this time using `_` (`_!` so `!`):

```!
Yet more content
```

```?
More content
Even more content
Yet more content
```

### Create a file without showing its name

```txt test2
test
```

This is alternative syntax for the one based on placing an inline code run with
the file name atop the fenced code block. It is useful for when the file name of
the file has already been mentioned in writing and repeating it using the inline
code run would result in redudant content for the human reader.

### Insert into a file

```test!
Even more content
New content
Yet more content
```

The leading and trailing lines are used to determine where in the file to place
the lines between them.

This will result in `test` having this content:

```?
More content
Even more content
New content
Yet more content
```

### Patch a file

With syntax highlighting:

```patch _
- More content
- Even more content
- New content
+ Content
```

Or just use our trusty `!` marker:

```!
- Content
- Yet more content
+ Some content
+ Some other content
```

Line starting with `-` are removed, lines starting with `+` are added and lines
that start with neither are unchanged and checked for being the same.

This results in:

```?
Some content
Some other content
```

### Ignore verbatim code blocks

MarkDown supports verbatim code blocks denoted by `~~~`. These are used to embed
fenced code blocks within a document verbatim, without interpreting them. We can
showcase a MarkRight fenced code block in source (as opposed to rendered) form
by wrapping it in verbatim code blocks:

~~~
```?
Some content
Some other content
```
~~~

The above is the exact MarkDown syntax of a file match check (of the last file).

### Throwing on interactive scripts

~~~
```sh
time
```
~~~

A script like this will prompt the user for input. MarkRight doesn't support
interactivity this way, because the input provided would not be captured as a
part of the document and this would deviate from the idea of the MarkRight
document being the single source of truth.

We are considering providing ways of passing messages to processes to control
them by providing the messages in the document using a `stdin` code block, but
that's not in the works yet.

At the moment a code block like this simply errors to let you know the script is
expecting user input which we don't support. The document author should find a
way to pass all the necessary information for the document a different way, like
using config files, passing CLI switches of piping files to the process' stdin.

**Note:** This is currently in development and turned on yet. Stay tuned.
