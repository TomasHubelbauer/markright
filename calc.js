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

// Print the equation argument we received
console.log(equation);
