// Instruct on how to pass the equation argument if missing
if (!equation) {
  console.error('Please provide an equation using a command line argument.');
  process.exit(1);
}

// Validate the `equation` argument for operand-operation-operand format
const match = /^(?<leftOperand>\d+)(?<operator>(\+|-|\*|\/))(?<rightOperand>\d+)$/.test(equation);
if (!match) {
  console.error('The equation argument does not match the expected format.');
  process.exit(1);
}

// Print the equation argument we received
console.log(equation);
