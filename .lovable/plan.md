
## Goal
Let Codex (OpenAI's coding agent) edit this website's source code directly.

## Why this path
The MCP server we already built exposes **app data and actions** (conversations, leads, orders) to AI assistants at runtime — it does NOT give Codex access to your source files. Codex edits code by reading/writing a **Git repository**, so the right integration is Lovable's GitHub sync.

Once the project is on GitHub, Codex clones the repo, edits files, and opens pull requests. Lovable's two-way sync then pulls those changes back into your project automatically — you keep building in Lovable, Codex works on the same codebase, and both stay in sync in real time.

## Steps

1. **Connect this project to GitHub** (one-time, done by you)
   - In Lovable: bottom-left **+** menu in the chat input → **GitHub** → **Connect project**
   - Authorize the Lovable GitHub App
   - Pick the GitHub account/org that owns the new repo
   - Click **Create Repository** — Lovable pushes the current code and turns on two-way sync

2. **Give Codex access to that repo** (done in ChatGPT/Codex)
   - Open Codex → Settings → **Connectors** / **GitHub**
   - Sign in with the same GitHub account (or grant the Codex GitHub App access to just this repo)
   - Select the newly created repository

3. **Working loop after setup**
   - Ask Codex to make a change → it opens a pull request on GitHub
   - Review and merge the PR on GitHub
   - Lovable auto-syncs the merged changes back into your project within seconds
   - You can keep editing in Lovable in parallel; commits flow both ways

## Notes / trade-offs
- **Paid Lovable plan required to edit code** (viewing is free). GitHub sync itself is free.
- **Secrets stay in Lovable**, not in the repo — Codex won't see `SUPABASE_SERVICE_ROLE_KEY`, connector keys, etc. If Codex needs to reference a secret, it should read it via `process.env.NAME` in server code; you add the actual value in Lovable.
- **Migrations**: Codex can write SQL files under `supabase/migrations/`, but they only run when applied through Lovable — mention this to Codex so it doesn't try to run `supabase db push` locally.
- **Merge conflicts** are possible if you and Codex edit the same file at the same time. Prefer working on different areas concurrently, or let one finish before the other starts.
- **Alternative if you don't want GitHub**: there isn't a good one today. Codex needs a repo. The only other option is downloading the code as a ZIP (paid plan, Code Editor → Download codebase) and hosting it yourself — but then Lovable stops being the source of truth. GitHub sync is strongly recommended.

## What I'll do after you approve
Nothing to build in the codebase — this is a two-side setup you perform in Lovable's UI and Codex's UI. I'll confirm the plan, and once you've clicked through the GitHub connect flow I can verify the repo is wired correctly and walk you through the Codex side.
