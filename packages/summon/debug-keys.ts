import * as readline from "node:readline";

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

console.log("Press any key (Ctrl+C to quit)...\n");

process.stdin.on("keypress", (char, key) => {
  console.log({
    char: JSON.stringify(char),
    charCode: char ? char.charCodeAt(0) : null,
    key_name: key?.name,
    key_sequence: JSON.stringify(key?.sequence),
    key_ctrl: key?.ctrl,
    key_meta: key?.meta,
    key_shift: key?.shift,
  });
  if (key?.ctrl && key?.name === "c") process.exit(0);
});
