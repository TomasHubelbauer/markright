# MarkRight

MarkRight is an upcoming literate programming tool.

MarkRight works by reading `readme.md` and interpreting it such that inline and
code blocks are either executed (if they are shell scripts), appended to a file
(if the file already exists), inserted into a file (if the file already exists
and there is context from which it is possible to deduce where in the file to
place the code), used to create a new file (it the code block follows an inline
block which looks like a file name) or patched to a file (if the fenced code
block language tag is `diff`).

These features enable generating any code base by building up a document which
describes its creation process. The intended use is such that a repository using
MarkRight has only a single entry-point, the `readme.md` file, which is the only
file being edited manually and the rest of the repository is generated and read-
only.

MarkRight is not intended for building "regular" software projects, instead, it
is meant as an educational tool. It solves a problem with regular tutorial-type
repositories where the author experiments a solution up and then writes the
tutorial based on it, forgetting important bits in the process or updating the
experimental basis later without updating the tutorial, which leads to non-
reproducible tutorials. MarkRight is closer to the notebook approach used in
data science and is inspired by lab notebooks in general.

The generated code base is not meant to be ignored in Git, since the whole point
of MarkRight is to be educational, it is preferred that the output can be viewed
and studied right away, without running MarkRight or even knowing what MarkRight
is. Editing of the generated code base is however highly discouraged and also
futile as the next run of MarkRight will replace the generated files anyway.

There are unsolved problems, such as the exact syntax of the code blocks or how
to reference external assets being pulled into the project, but these problems
are not too pressing, as MarkRight should be useful even before these are solved
(if they ever are).

## Example

Since this document is written in MarkDown, it itself is a valid MarkRight
document. It continues on to show case all the various featutes and elaborates
on the syntax that enables them. We also have a more focused sample document in
[`sample.md`](sample.md). Run it by running `npm test`.

Up until this point, `readme.md` produces no output. To create a file, do this:

`hello-world.txt`
```
hello world
```

The above will create a file named `hello-world.txt` and place `hello world` as
its content.

To delete it, use the following:

```sh
rm hello-world.txt
```

That's the basic working process of MarkRight.

A more detailed look follows.

### Create a file

`hello-world.txt`
```
hello-world
```

### Append to a file

The last file mentioned by name is `hello-world.txt` so we can just place in a
code block with the new contents (a newline is inserted after each code block
so this will be on a new line):

```
test
```

### Replace file content

```diff
-hello world
+new hello world
```

This will replace the `hello world` line with `new hello world` line.

### Insert into the file

```
new hello world
new test
test
```

Since the first and last line(s) match an already existing area of the file's
content, the added area is deduced and placed in such that it fits the content
surrounding it in the code block.

The file content now looks like this:

```
new hello world
new test
test
```

This code block will replace `hello-world.txt` with this new content which at
this point is a no-op since we're just repeating its current content.

### Create a different new file

`test.txt`
```
```

This will create another new file and start treating that one as the current
open file.

## Considerations

The syntax of the code blocks and how they associate to files may change.
Currently we remember the open file and change that pointed by naming a new file
followed by a code block. This alone will probably not be enough and force an
awkward style of writing. Another option might be to use something like this in
the fenced code block language tag: `lang file-name.ext` or even `diff lang` for
diffs which also have code highlighting based on the language tag.

This would break compatibility with existing MarkDown renderers, so I'm still
weighing the options here.

## To-Do

### Cache the unchanged layers

Do not run the whole document each time, recognize the changed part (usually the
very end) and run only the part that has changed.

### Address code to-do comments

### Add a `watch` script to `package.json`

Use globally installed Nodemon for it.

### Think about VS Code Intellisense support

This one is going to be very tricky… For each code block, we need to determine
the full content of the file it relates to (because it might be a patch block)
and use that code to fuel the Intellisense for the given language.

Remains to be seen if this is going to even be possible using the VS Code API.

It might also be necessary to either store the texts in temporary files or use
the generated files and only "translate" the cursor in the code block to the
backing content in the generated file so that things like modules work (VS Code
knows what to suggest for module paths etc.).

### Implement patch blocks which work by providing leading and trailing lines

Patching using `patch` and `diff` code blocks is good for deleting stuff, but it
would be cumbersome to use it for updates which are mostly or fully additions.
For such updates, I'm thinking of making MarkRight see if the first and last
line(s) of the given patch block text are already present in the file and follow
each other and from that determine the position at which the remaining text of
the patch block text is to be inserted in the file.

### Consider special-casing `_` as a file name for the last file

This way it remains possible to distinguish which code blocks are for display
only and which are for updates without repeating the file name ad-nauseam.

### Add support for CRLF or document only supporting CR somewhere
