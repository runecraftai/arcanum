Goal: Install the OpenCode Dynamic Context Pruning (DCP) plugin to let the agent automatically manage its conversation context and reduce token usage.

Instructions:
1. From a shell, run:
   ```
   opencode plugin @tarquinen/opencode-dcp@latest --global
   ```
   This installs the package and adds it to the global OpenCode config.
2. Restart OpenCode.
3. Verify the plugin is loaded by executing the `/DCP` command.
4. Print the installed version, the config file path that was modified, and the exact config snippet that was added.

Reference: https://github.com/Opencode-DCP/opencode-dynamic-context-pruning
