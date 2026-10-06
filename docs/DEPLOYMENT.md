# GitHub Pages deployment

## Intended live URL

https://mtaver.github.io/TETE/

## Current deployment status

On 2026-10-06, commit `c96df8e` triggered the first **Deploy Tete to GitHub Pages** workflow run. Dependency installation, all 12 tests, and the production build passed in GitHub Actions. The run then failed at **Configure GitHub Pages** because Pages is not enabled for the repository. GitHub reported:

> Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions.

The deploy job was skipped, so the HTTPS application and its live offline/update behavior have **not** been verified. The failed run is available at https://github.com/mtaver/TETE/actions/runs/37436682099.

## One-time repository setting

An administrator of `mtaver/TETE` must:

1. Open https://github.com/mtaver/TETE/settings/pages.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open https://github.com/mtaver/TETE/actions/workflows/deploy-pages.yml.
4. Select **Run workflow**, choose `main`, and run it. Alternatively, open the failed run and select **Re-run all jobs**.
5. Wait for both `build` and `deploy` to complete successfully, then open https://mtaver.github.io/TETE/.

No personal access token should be added merely to enable Pages; the one-time repository setting is sufficient. After Pages exists, the workflow’s scoped `pages: write` and `id-token: write` permissions support subsequent deployments.

## Verification checklist after enablement

Record each item as pass or fail only after checking the live HTTPS origin:

- Home page loads without missing JavaScript, CSS, icon, or manifest assets.
- Case library, all three cases, schematic ECGs, questions, hints, submission feedback, and progress dashboard work.
- After one online load, disconnect, reload `/TETE/`, open every case, use a hint, submit a practice attempt, and verify progress persists.
- With progress recorded, deploy a second distinct commit/build. Confirm the update notification appears.
- Start an attempt while that update is waiting. Confirm the update button is disabled and entered answers are not interrupted.
- Leave or submit the attempt, apply the update, and confirm the build identifier changes while the prior progress and rating remain.

These live checks remain pending until the one-time Pages setting is enabled and a deployment succeeds.
