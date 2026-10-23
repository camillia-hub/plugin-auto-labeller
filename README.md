# Auto Labeller

Keeps task titles searchable by inferring area and kind labels from the task
text and prepending the missing ones, e.g. `[area:backend] [kind:bug] Fix
login crash`. Tasks that are already labelled are left untouched.

## Hook registered

- `task.created` → `taskCreated(event)` via the exported `hooks` map.

## Grants requested

- `edit-task` — the plugin's only operation is `set_title`. It never posts
  comments, so it does not need `comment-task`.

## Behaviour

- Keyword tables for kinds (`bug`, `feat`, `chore`) and areas (`frontend`,
  `backend`, `infra`, `docs`) live at the top of `index.js`
  (`KIND_KEYWORDS`, `AREA_KEYWORDS`); first matching entry wins.
- Matching is case-insensitive and word-boundary aware, so `prefix` does not
  trigger the `fix` keyword.
- Existing `[area:...]` / `[kind:...]` prefixes in the title are detected and
  never duplicated; only the missing labels are prepended.
- Returns at most one `set_title` operation. If nothing matches, the title is
  already labelled, or the new title would exceed the 500 character limit,
  the plugin returns `[]` (no-op) and never throws.

## Example

Event:

```json
{
  "hook": "task.created",
  "taskTitle": "Fix crash in login API",
  "taskDescription": "The login endpoint returns 500 and crashes."
}
```

Operations returned:

```json
[
  { "type": "set_title", "value": "[area:backend] [kind:bug] Fix crash in login API" }
]
```

## Install

Install from the Camillia marketplace (or upload the files listed in
`hub.json`: `plugin.json`, `index.js`, `package.json`) and enable the plugin
for your workspace. Requires Node.js 22 or newer to run the tests with
`npm test`.
