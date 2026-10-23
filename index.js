// plugin-auto-labeller
// Infers [area:*] and [kind:*] labels from task text and prepends the missing
// ones to the title, e.g. "[area:backend] [kind:bug] Fix login crash".
// Grant requested: edit-task (the plugin only ever returns set_title operations).

const MAX_TITLE_LENGTH = 500;

// --- Configurable keyword tables -------------------------------------------
// First matching entry wins, so keep each table ordered by priority.
export const KIND_KEYWORDS = [
  ["bug", ["bug", "fix", "crash", "error", "regression", "broken", "defect", "hotfix"]],
  ["feat", ["feature", "add", "support", "implement", "introduce"]],
  ["chore", ["chore", "cleanup", "refactor", "bump", "upgrade", "dependency", "dependencies"]],
];

export const AREA_KEYWORDS = [
  ["frontend", ["ui", "frontend", "css", "react", "button", "page", "screen", "layout", "styling"]],
  ["backend", ["api", "backend", "server", "endpoint", "database", "db", "migration", "query"]],
  ["infra", ["infra", "deploy", "deployment", "pipeline", "docker", "kubernetes", "terraform"]],
  ["docs", ["docs", "documentation", "readme", "guide", "changelog", "tutorial"]],
];
// ---------------------------------------------------------------------------

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toMatchers(table) {
  return table.map(([label, words]) => [
    label,
    words.map((word) => new RegExp("(?<![A-Za-z0-9])" + escapeRegExp(word) + "(?![A-Za-z0-9])", "i")),
  ]);
}

const KIND_MATCHERS = toMatchers(KIND_KEYWORDS);
const AREA_MATCHERS = toMatchers(AREA_KEYWORDS);

function matchFirst(text, matchers) {
  if (typeof text !== "string" || text.length === 0) return "";
  for (const [label, regexes] of matchers) {
    if (regexes.some((regex) => regex.test(text))) return label;
  }
  return "";
}

export function detectKind(text) {
  return matchFirst(text, KIND_MATCHERS);
}

export function detectArea(text) {
  return matchFirst(text, AREA_MATCHERS);
}

export function hasLabel(title, prefix) {
  return typeof title === "string" && title.toLowerCase().includes("[" + prefix + ":");
}

export function computeNewTitle(event) {
  if (!event || typeof event !== "object") return "";
  const title = typeof event.taskTitle === "string" ? event.taskTitle.trim() : "";
  if (!title) return "";
  const description = typeof event.taskDescription === "string" ? event.taskDescription : "";
  const haystack = title + "\n" + description;
  const additions = [];
  if (!hasLabel(title, "area")) {
    const area = detectArea(haystack);
    if (area) additions.push("[area:" + area + "]");
  }
  if (!hasLabel(title, "kind")) {
    const kind = detectKind(haystack);
    if (kind) additions.push("[kind:" + kind + "]");
  }
  if (additions.length === 0) return "";
  const candidate = additions.join(" ") + " " + title;
  return candidate.length <= MAX_TITLE_LENGTH ? candidate : "";
}

export async function taskCreated(event) {
  const newTitle = computeNewTitle(event);
  if (!newTitle) return [];
  return [{ type: "set_title", value: newTitle }];
}

export const hooks = {
  "task.created": taskCreated,
};
