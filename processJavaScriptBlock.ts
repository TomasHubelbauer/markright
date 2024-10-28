export default async function processJavaScriptBlock(code: string) {
  try {
    // Note that top-level await is not supported
    // See https://github.com/oven-sh/bun/issues/14873
    const result = eval(code);
    if (result !== undefined) {
      console.log(result);
    }
  }
  catch (error) {
    console.error(error.message);
  }
}
