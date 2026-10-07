#!/usr/bin/env node
// The command line entry; the work is in `symbols-lib.mjs`, which a test can import.
import {main} from './symbols-lib.mjs';

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
