---
title: "Git Workflow for Professional Development"
date: "2026-03-03"
tags: ["dev-tools", "git", "workflow"]
excerpt: "Master Git beyond the basics. Learn branching strategies, interactive rebase, bisect for debugging, and team collaboration patterns."
---

# Git Workflow for Professional Development

Git is more than `add`, `commit`, `push`. Here's what you need for professional development.

## Branching Strategy

### Git Flow (for larger teams)

```
main ────────────────────────────────────
  │                                    ↑
  └── develop ──────────────────── merge
        │           ↑
        └── feature/auth ── merge
        └── feature/api ─── merge
```

### Trunk-Based Development (for smaller teams)

```
main ──────────────────────────────────
  │     ↑     │      ↑
  └── fix ──┘  └── feat ──┘
  (short-lived branches)
```

## Essential Commands

### Interactive Rebase

Clean up your commit history before merging:

```bash
# Squash last 3 commits into one
git rebase -i HEAD~3
```

In the editor:
```
pick abc1234 Add user model
squash def5678 Fix typo in user model
squash ghi9012 Add validation to user model
```

### Git Bisect

Find the commit that introduced a bug:

```bash
git bisect start
git bisect bad          # Current commit is broken
git bisect good v1.0    # This version was working

# Git will checkout commits for you to test
# After testing each:
git bisect good  # or
git bisect bad

# When found:
git bisect reset
```

### Stash

Save work-in-progress without committing:

```bash
git stash                    # Save changes
git stash list               # View stashed changes
git stash pop                # Apply and remove latest stash
git stash apply stash@{2}   # Apply specific stash
```

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user authentication
fix: resolve race condition in payment processing
docs: update API documentation
refactor: extract validation logic into utility
test: add unit tests for order service
chore: update dependencies
```

## .gitignore Best Practices

```gitignore
# Dependencies
node_modules/

# Build output
dist/
.next/

# Environment variables
.env
.env.local

# IDE
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db
```

## Tips

1. **Commit often, push regularly** — small, focused commits
2. **Never force push to shared branches**
3. **Write meaningful commit messages**
4. **Use pull requests for code review**
5. **Keep branches short-lived** (< 2 days ideally)
