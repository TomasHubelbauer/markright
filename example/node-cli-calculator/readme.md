# Sample

## Introduction

This is a test document used to demonstrate the various features of MarkRight.

Let's build a simple calculator application in Node using MarkRight. We want it
to support four basic operations: addition, subtraction, multiplication and
division, and we will support equations with two operands only. This is going to
be a small enough project not to distract from showcasing MarkRight, but larger
than your typical hello world application.

## Hello, World!

Let's start off easy, create the entry-point file, output some message and check
that the given message has been output, indeed. (Alright, we _are_ starting with
a hello world, but we won't end there!)

`calc.js`
```js
console.log('Hello, world!')
```

This standalone inline code span followed by a fenced code block in the MarkDown
file resulted in creation of `calc.js` with the given content using MarkRight.

Now, let's run the file and let's see what it outputs. To run a script, just use
a shell command to do so. Indeed, to do anything with any file, or anything else
for that matter, just use a shell script!

```sh
node calc.js
```

This will give us the following output:

```stdout
Hello, world!
```

But what if it doesn't? Then our document would go right out of date, it would
mislead! It would no longer describe the reality of the project we're building.
MarkRight is not here to strenghten the status quo on this. That's why in MR,
any fenced code block can use `stdout` as a language tag (also called an _info
string_ in GFM) to designate that MarkRight should check that the output of the
last shell fenced code block is actually the content of the `stdout` code block.

At this point, we can be sure that `cals.js` when run through Node prints the
`Hello, world!` message to the standard output.

## Let's Reset

Let's clear the file so that we can start working on the calculator logic in it.
We can do this using a `diff` fenced code block. This code block is used to
patch the content of the file based on the patch provided in the code block.
We want to clear the file, so we'll provide a patch which removes all of its
content:

```patch _
- console.log('Hello, world!')
```

To the reader, it's clear that this patch applies to the `calc.js` file as that
is what we're talking about here, but MarkRight needs to know whether we're just
printing a code block or we want MR to actually affect any file with its text.
We've already designated that once by preceeding the `calc.js` code block with
the standalone inline code run with the file name. We could do that again, but
we'll use an alternative this time: using the `patch calc.js` info text. This
will associate the file name with the fenced code block the same way the
previous technique did, but it will hide the file name from the rendered output
of the MarkDown document (as the info text is never rendered), and it won't even
break the syntax highlight for `patch` as only the first word of the info text
is used to determine what syntax highlighter to use.

Oh, and by the way, we can replace `calc.js` with `_` anywhere where a file name
is accepted and it will resolve to the last file name. On top of this, if a MR
suffix would follow the file name we used the underscore for instead, we can use
only the suffix and the last file name will be restored.

Now we can be sure the file is empty. We can assert this, too, like with the
stdout content. For that we use yet another variant of info text content:
`js ?`. The question mark here tells MarkRight to not replace the text of the
`calc.js` file with the text of the code block, but instead compare the two. If
we left it out, it would just replace `calc.js` with the same content it alredy
has, making no check. This typo would not be catastrophic, we would indeed lose
the information about the file not having the expected content, which would be
suboptimal, but we would ensure that it has the expected content coming forward,
so this syntax has been selected.

```?
```

## Accepting Input

With an empty `calc.js` file, let's get cracking on the calculator logic
implementation. Let's start by printing command line arguments we receive and
running the script with some test arguments.

```js _
// Pull out the equation argument
const [ , , equation, ...rest ] = process.argv;

// Ensure no additional arguments are being passed in
if (rest.length > 0) {
  console.error('Too many command line arguments, need just one: equation.');
  process.exit(1);
}

// Instruct on how to pass the equation argument if missing
if (!equation) {
  console.error('Please provide an equation using a command line argument.');
  process.exit(1);
}

// Print the equation argument we received
console.log(equation);
```

## Trust, But Verify

Calling this with no arguments:

```sh
node calc.js
```

We get the expected error:

```stderr 1
Please provide an equation using a command line argument.
```

Calling this with an argument:

```sh
node calc.js 1+1
```

We see the argument printed back:

```stdout
1+1
```

## Now You Have Two Problems

Next up, we need to validate the equation format (using a regex) and pull out
the operands and the operator. Then we can carry out the evaluation and print
the result.

```js !
// Instruct on how to pass the equation argument if missing
if (!equation) {
  console.error('Please provide an equation using a command line argument.');
  process.exit(1);
}

// Validate the `equation` argument for operand-operation-operand format
if (!/^\d+(\+|-|\*|\/)\d+$/.test(equation)) {
  console.error('The equation argument does not match the expected format.');
  process.exit(1);
}

// Print the equation argument we received
console.log(equation);
```

## Get Them Diamonds

This check works fine, but we can improve it by pulling out the operands and the
operation while we're doing the format check to kill two birds with one stone:

```js !
// Validate the `equation` argument for operand-operation-operand format
const match = /^(?<leftOperand>\d+)(?<operator>(\+|-|\*|\/))(?<rightOperand>\d+)$/.exec(equation);
if (!match) {
  console.error('The equation argument does not match the expected format.');
```

The `match.groups` object will contain the operands and the operator now. We can
print those instead of the `equation` string:

```patch _
- // Print the equation argument we received
- console.log(equation);
+ // Print the equation parts we received
+ const { leftOperand, operator, rightOperand } = match.groups;
+ console.log({ leftOperand, operator, rightOperand });
```

Let's run the script again and see if the extraction of parts worked out:

```sh
node calc.js 1+1
```

```stdout
{ leftOperand: '1', operator: '+', rightOperand: '1' }
```

Looks like everything is working fine. Next up, let's validate the operands are
both valid numbers JavaScript can represent.

## Conversion

```js !
// Print the equation parts we received
const leftOperand = Number(match.groups.leftOperand);
const rightOperand = Number(match.groups.rightOperand);
if (Number.isNaN(leftOperand) || Number.isNaN(rightOperand)) {
  console.error(`Either ${match.groups.leftOperand} or ${match.groups.rightOperand} is not a valid JS number.`);
  process.exit(1);
}

const { operator } = match.groups;
console.log({ leftOperand, operator, rightOperand });
```

Are we still getting what we need? Now the `leftOperand` and `rightOperand`
variables should be typed as numbers as a bonus:

```sh
node calc.js 1+1
```

```stdout
{ leftOperand: 1, operator: '+', rightOperand: 1 }
```

## Operate

We do not need to validate the operator, the regex already does it for us, so
the only thing left now is to implement a `switch` which based on the operator
prints the resulting value of the equation:

```js !
const { operator } = match.groups;
switch (operator) {
  case '+': {
    console.log(leftOperand + rightOperand);
    break;
  }
  case '-': {
    console.log(leftOperand - rightOperand);
    break;
  }
  case '*': {
    console.log(leftOperand * rightOperand);
    break;
  }
  case '/': {
    console.log(leftOperand / rightOperand);
    break;
  }
}

console.log({ leftOperand, operator, rightOperand });
```

```sh
node calc.js 1+1
```

```stdout
2
{ leftOperand: 1, operator: '+', rightOperand: 1 }
```

This looks great. Let's get rid of the debug `console.log` statement and then
put the final code through its paces.

```patch _
- console.log({ leftOperand, operator, rightOperand });
```

## Testing Course

```sh
node calc.js 10+2
node calc.js 10-2
node calc.js 10*2
node calc.js 10/2
```

```stdout
12
8
20
5
```

Fantastic. Our calculator works now. We'll call it a day soon, but to close off,
let's implement one more quality of life improvement for our users: let's allow
them to surround the operator with white-space, should they so desire. E.g.:
`10 + 2` should be supported, too. We'll need to update the regex for this.

## UX!

```patch _
- const match = /^(?<leftOperand>\d+)(?<operator>(\+|-|\*|\/))(?<rightOperand>\d+)$/.exec(equation);
+ const match = /^(?<leftOperand>\d+)\s?(?<operator>(\+|-|\*|\/))\s?(?<rightOperand>\d+)$/.exec(equation);
```

Applying this change, let's ensure the original set of test expressions still
works:

```sh { "stdout": "12\n8\n20\n5\n" }
node calc.js 10+2
node calc.js 10-2
node calc.js 10*2
node calc.js 10/2
```

That looks okay.

And with spaces:

```sh { "stdout": "12\n8\n20\n5\n" }
node calc.js "10 + 2"
node calc.js "10 - 2"
node calc.js "10 * 2"
node calc.js "10 / 2"
```

Everything still works as expected!

## Conclusion

This is it! Our calculator application is now done, works as expected and what's
more, we have a precise record of how and why we built it the way we did. The
application itself is a mere artifact of the process of our building of it.

This document can never go out of sync with what the application does, because
it _is_ the application for all intents and purposes. And I think that's great!
