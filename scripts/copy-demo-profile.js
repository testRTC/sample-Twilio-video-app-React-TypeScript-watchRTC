/**
 * Copies the watchRTC Detect pilot's demo profile into the app (RTC-5586, plan Step 16; S-118 option B, the person's
 * choice, 2026-11-25, step16-stop-answers.md).
 *
 * Source: ../watchrtc-sdk/profiles/cyara.demo@1.json, the D3 demo profile in the sibling SDK checkout (the same folder
 * the `file:../watchrtc-sdk` dependency needs). Target: src/detect/cyara.demo@1.json, copied byte for byte.
 *
 * The target is gitignored and must never be committed: this repository is public, and the profile's values are
 * Cyara-internal (FD 4.2.7, R-159). Runs from `postinstall`, so `yarn install --force` refreshes it after every SDK
 * change. This script prints no profile value.
 */
const fs = require('fs');
const path = require('path');

const appRoot = path.resolve(__dirname, '..');
const source = path.resolve(appRoot, '..', 'watchrtc-sdk', 'profiles', 'cyara.demo@1.json');
const target = path.resolve(appRoot, 'src', 'detect', 'cyara.demo@1.json');

if (!fs.existsSync(source)) {
  console.error(
    `copy-demo-profile: the Detect demo profile was not found at ${source}.\n` +
      'Check out watchrtc-sdk beside this app, on the Detect suite branch, then run `yarn install --force` again.'
  );
  process.exit(1);
}

try {
  fs.copyFileSync(source, target);
} catch (err) {
  console.error(`copy-demo-profile: could not copy ${source} to ${target}: ${err.message}`);
  process.exit(1);
}
console.log(`copy-demo-profile: copied the Detect demo profile to ${path.relative(appRoot, target)} (gitignored).`);
