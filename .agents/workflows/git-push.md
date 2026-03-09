---
description: commit and push all changes to GitHub
---

// turbo-all

1. Stage all changes:
```
git add .
```

2. Commit with a descriptive message based on what files changed. Use `git status` to see what changed and write a meaningful commit message in the format: `feat/fix/update: short description of changes`
```
git diff --cached --name-only
```

3. Commit the staged files:
```
git commit -m "update: sync latest changes"
```

4. Push to GitHub:
```
git push origin main
```
