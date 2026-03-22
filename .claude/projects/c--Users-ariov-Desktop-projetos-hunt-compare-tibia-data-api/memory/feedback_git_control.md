---
name: git_control
description: User controls git manually — Claude should never commit, branch, or run git commands
type: feedback
---

Never run git commands (commit, branch, push, etc.) unless the user explicitly asks to undo/fix something git-related. The user controls git entirely on their own.

**Why:** User wants full manual control over git. Commits are theirs to create with their own messages.

**How to apply:** Write code only. Do not commit or create branches proactively. Only run git commands if the user explicitly requests (e.g. "undo my last commit").
