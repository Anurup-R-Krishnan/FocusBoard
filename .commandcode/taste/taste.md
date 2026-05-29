# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# aur
- When rebuilding an AUR package that sources from git, commit changes before running makepkg — working-tree edits are not picked up by the git clone in prepare(). Confidence: 0.80

# rust
- The `user-idle` crate (v0.6.0) internally spawns threads that call X11 functions; on Hyprland/Wayland this segfaults when DISPLAY is set — skip X11-based idle detection on Wayland sessions. Confidence: 0.70
- On Hyprland, systemd user manager has `XDG_CURRENT_DESKTOP` and `HYPRLAND_INSTANCE_SIGNATURE` but NOT `XDG_SESSION_DESKTOP` — use those for Hyprland session detection in daemon processes. Confidence: 0.70

# backend
- NeDB `distinct(field)` is a method on the model itself (e.g., `Model.distinct('field')`), NOT on the QueryBuilder returned by `.find()`. Confidence: 0.70

# workflow
- After making code changes, use grep/search extensively to self-verify that nothing was missed and all references are updated. Confidence: 0.80
- Do not rebuild or install the package proactively — wait for an explicit request. Confidence: 0.80

