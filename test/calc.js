// Pull out the equation argument
const [ , , equation, ...rest ] = process.argv;

// Ensure no additional arguments are being passed in
if (rest.length > 0) {
  throw new Error('Too many command line arguments, need just one: equation.');
}

// Instruct on how to pass the equation argument if missing
if (!equation) {
  console.error('Please provide an equation using a command line argument.');
  process.exit(1);
}

// Validate the `equation` argument for operand-operation-operand format
const match = /^(?<leftOperand>\d+)\s?(?<operator>(\+|-|\*|\/))\s?(?<rightOperand>\d+)$/.exec(equation);
if (!match) {
  console.error('The equation argument does not match the expected format.');
  process.exit(1);
}

// Print the equation parts we received
const leftOperand = Number(match.groups.leftOperand);
const rightOperand = Number(match.groups.rightOperand);
if (Number.isNaN(leftOperand) || Number.isNaN(rightOperand)) {
  console.error(`Either ${match.groups.leftOperand} or ${match.groups.rightOperand} is not a valid JS number.`);
  process.exit(1);
}

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

