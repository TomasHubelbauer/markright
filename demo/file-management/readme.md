# File management

## Create, replace

This creates a new file with the below content:

`file-name-external.txt`:

```
Hello, world! (External)
```

It can be shortened by specifying the file name inline with the `..` prefix:

```txt ..file-name-internal.txt
Hello, world! (Internal)
```

## Append

Use the `!` sigil to signify the content code block is to be added to the file
and not replace it altogether:

`file-name-external.txt`:

```txt !
Hello, world! (External again)
```

This can be shortened as well by specifying the file name inline but using the
`!!` prefix instead of the `..` one for creation.

```txt !!file-name-internal.txt
Hello, world! (Internal again)
```

## Check

When needing to highligt a file in its entirety, the match sigil can be used.
It will compare the file's contents on the disk with the code block content and
will error if they do not match.

`file-name-external.txt`:

```txt ??
Hello, world! (External)

Hello, world! (External again)

```

```txt ??file-name-internal.txt
Hello, world! (Internal)

Hello, world! (Internal again)

```

The prefix to use here is `??`.

## Move, delete

Deleting and moving files is relegated to the shell handler, e.g.:

~~~
```sh
mv file-name.ext file-name-moved.ext
rm file-name-moved.ext
```
~~~
