---
name: org-release
description: Prepare a release of an unset.sh repository for the owner's approval. Use when a package or release asset should be published, when asked to tag or cut a version, or when a release workflow waits or fails.
---

# Prepare a release

A release is a tag `v<version>` on a commit of `main`. The release workflow builds the artefact once, waits
for the owner's approval in the `release` environment, then attests and publishes that same artefact.
Assistants prepare a release; only the owner approves it.

## Before the tag

1. Check that the repository has a `release` environment with the owner as required reviewer, limited to
   tags `v*`. If it does not, stop and ask the owner to set it up. Assistants do not create it.
2. Decide the version. Major: something consumers rely on changed meaning or was removed. Minor: something
   was added. Patch: a fix with no change for consumers.
3. In one pull request, raise the version in the repository's manifest and add the changelog entry. The
   entry says what changes for consumers, in plain words.
4. Where the repository requires a review record before a release, a separate thread writes it from the full
   diff since the last release. The author of the changes does not review them.
5. Merge to `main` by the repository's rule, and wait until the checks on `main` are green.

## The tag

6. Tag the merged commit on `main` as `v<version>` and push the tag. The workflow refuses a tag that does not
   match the manifest's version or is not on `main`.
7. Tell the owner the release waits for approval, with a link to the workflow run and the changelog entry.

## After approval

8. Check that the artefact was published and that its attestation exists. Until a first release has proved
   these steps in a repository, say they are unverified.
9. Consumers take the release by an exact version, each in its own pull request.

## Never

- Never move, delete or reuse a tag. A bad release is fixed by a new version.
- Never publish from a branch, a fork or a local machine.
- Never approve, bypass or remove the approval step, and never add a stored token to make publishing work.
