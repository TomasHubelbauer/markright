import processJavaScriptBlock from './processJavaScriptBlock';

const transpiler = new Bun.Transpiler();

export default async function processTypeScriptBlock(code: string) {
  // See https://github.com/oven-sh/bun/issues/11976 for why we need this here
  const transpiledCode = await transpiler.transform(code, 'ts');
  await processJavaScriptBlock(transpiledCode);
}
