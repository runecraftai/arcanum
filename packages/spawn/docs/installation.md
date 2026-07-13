# Installation Guide

Follow these steps to install and configure the **spawn** plugin.

## Prerequisites

- **OpenCode** installed and configured
- **tmux 2.6+** installed — see platform commands below:
  - macOS: `brew install tmux`
  - Ubuntu/Debian: `sudo apt install tmux`
  - Arch: `sudo pacman -S tmux`
  - Fedora/RHEL: `sudo dnf install tmux`
  - Windows (WSL): `sudo apt install tmux` inside your WSL distro
  - Windows (native): `winget install tmux`
- Verify: `tmux -V`

## Installation

Add `"@runecraft/spawn"` to the `plugin` array in your OpenCode config (`~/.config/opencode/opencode.json`):

```json
{
  "plugin": [
    "@runecraft/spawn"
  ]
}
```

If you already have other plugins configured, append it to the array:

```json
{
  "plugin": [
    "some-other-plugin",
    "@runecraft/spawn"
  ]
}
```

Restart your terminal and run `opencode`. The plugin handles the rest.

## Verification

1. Start a new terminal session.
2. Type `opencode` (it should launch tmux automatically).
3. In OpenCode, run `/help` or check the logs to verify the plugin is active.
