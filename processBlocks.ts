import { $ } from 'bun';
import type { Block } from './Block';
import fs from 'fs';
import processStdoutBlock from './processStdoutBlock';
import processStderrBlock from './processStderrBlock';
import processJavaScriptBlock from './processJavaScriptBlock';
import processTypeScriptBlock from './processTypeScriptBlock';
import processShellBlock from './processShellBlock';

const HANDLERS_WITHOUT_META = {
  txt: processStdoutBlock,
  stdout: processStdoutBlock,
  stderr: processStderrBlock,
  js: processJavaScriptBlock,
  javascript: processJavaScriptBlock,
  ts: processTypeScriptBlock,
  typescript: processTypeScriptBlock,
  sh: processShellBlock,
};

const HANDLERS_WITH_META = {};

export default async function processBlocks(blocks: Block[]) {
  for (const block of blocks) {
    if (!block.tag) {
      if (!block.path) {
        continue;
      }

      block.tag = 'txt';
    }

    const tag = block.tag.toLowerCase();
    const handlerWithMeta = HANDLERS_WITH_META[tag];
    const handlerWithoutMeta = HANDLERS_WITHOUT_META[tag];
    if (handlerWithMeta && handlerWithoutMeta) {
      throw new Error(`Duplicate handlers for the ${tag} language tag`);
    }

    if (!handlerWithMeta && !handlerWithoutMeta && block.tag !== 'diff' && block.tag !== 'patch') {
      continue;
    }

    // Bypass the handlers if the block mode is 'match' and just check the text
    if (block.path && block.mode === 'match') {
      const file = Bun.file(block.path);
      const text = await file.text();
      if (block.code !== text) {
        console.error(`'${block.path} does not match the expected content`);
      }

      continue;
    }

    // Bypass the handlers if the block mode is `diff` or `patch` and apply it
    if (block.tag === 'diff' || block.tag === 'patch') {
      if (!(await Bun.file(block.meta).exists())) {
        console.error(`'${block.meta}' does not exist to patch changes to`);
      }

      const { stdout: stdoutBuffer, stderr: stderrBuffer } = await $`echo ${block.code} | patch ${block.meta}`.quiet();
      const stdout = stdoutBuffer.toString();
      const stderr = stderrBuffer.toString();

      if (stdout !== `patching file ${block.meta}\n`) {
        console.error(stdout);
      }

      if (stderr) {
        console.error(stderr);
      }

      continue;
    }

    try {
      // See https://github.com/oven-sh/bun/issues/14874 for a better option
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;

      if (block.path) {
        const file = fs.createWriteStream(block.path, { flags: block.mode === 'append' ? 'a' : undefined });
        console.log = (...args: any[]) => file.write(args.join(' ') + '\n');
        console.error = (...args: any[]) => file.write(args.join(' ') + '\n');
      }

      if (handlerWithMeta) {
        await handlerWithMeta(block.meta, block.code);
      }
      else {
        if (block.meta) {
          console.error(`'${tag}' language tag handler does not support block meta`);
        }

        await handlerWithoutMeta(block.code);
      }

      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    }
    catch (error) {
      throw new Error(`Error processing ${tag} block: ${error.message}`);
    }
  }
}
