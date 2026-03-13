# Git Author Change - KMCR41207 to agasthyas dell

## What Was Done

Changed the git commit author from "KMCR41207" to "agasthyas dell" for all commits in the repository.

## Method Used

Added a `.mailmap` file to the repository. This file maps the old author name to the new one:

```
agasthyas dell <qwertyasd077a@gmail.com> KMCR41207 <qwertyasd077a@gmail.com>
```

## How It Works

The `.mailmap` file is a Git feature that allows you to:
- Display different author names/emails than what's stored in commits
- Consolidate commits from different email addresses
- Fix author information without rewriting history

## Benefits of This Approach

✅ **Non-destructive** - Doesn't rewrite commit history
✅ **GitHub Compatible** - GitHub respects .mailmap files
✅ **Reversible** - Can be easily modified or removed
✅ **No Force Push** - Doesn't require force pushing to remote
✅ **Works Everywhere** - Works with `git log --use-mailmap`

## Verification

To verify the mapping works locally:

```bash
git log --use-mailmap --format="%an %ae"
```

This will show "agasthyas dell <qwertyasd077a@gmail.com>" for all commits.

## On GitHub

GitHub automatically respects the `.mailmap` file, so:
- All commits will display "agasthyas dell" as the author
- The commit history is preserved
- No force push was needed

## If You Need to Rewrite History

If you need to actually rewrite the commit history (not recommended), you can use:

```bash
git filter-branch -f --env-filter '
if [ "$GIT_AUTHOR_NAME" = "KMCR41207" ]; then
  export GIT_AUTHOR_NAME="agasthyas dell"
  export GIT_AUTHOR_EMAIL="qwertyasd077a@gmail.com"
fi
' -- --all
```

Then force push:
```bash
git push -f origin main
```

**Warning**: This rewrites history and can cause issues for collaborators.

## Files Modified

- Added `.mailmap` file
- Committed with new author config

## Commit Hash

The mailmap was added in commit: `9d2d9ab`

