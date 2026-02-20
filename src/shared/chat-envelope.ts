const ENVELOPE_PREFIX = /^\[([^\]]+)\]\s*/;
const ENVELOPE_CHANNELS = [
  "WebChat",
  "WhatsApp",
  "Telegram",
  "Signal",
  "Slack",
  "Discord",
  "Google Chat",
  "iMessage",
  "Teams",
  "Matrix",
  "Zalo",
  "Zalo Personal",
  "BlueBubbles",
];

const MESSAGE_ID_LINE = /^\s*\[message_id:\s*[^\]]+\]\s*$/i;

function looksLikeEnvelopeHeader(header: string): boolean {
  if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z\b/.test(header)) {
    return true;
  }
  if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}\b/.test(header)) {
    return true;
  }
  return ENVELOPE_CHANNELS.some((label) => header.startsWith(`${label} `));
}

export function stripEnvelope(text: string): string {
  const match = text.match(ENVELOPE_PREFIX);
  if (!match) {
    return text;
  }
  const header = match[1] ?? "";
  if (!looksLikeEnvelopeHeader(header)) {
    return text;
  }
  return text.slice(match[0].length);
}

const UNTRUSTED_BLOCK = /^[A-Z][^\n]*\(untrusted[^)]*\):\n```json\n[\s\S]*?\n```\s*/gm;

export function stripUntrustedMetadataBlocks(text: string): string {
  if (!text.includes("(untrusted")) {
    return text;
  }
  UNTRUSTED_BLOCK.lastIndex = 0;
  const stripped = text.replace(UNTRUSTED_BLOCK, "");
  return stripped === text ? text : stripped.trimStart();
}

const SYSTEM_EVENT_LINE = /^System: \[.+\].*$/;

export function stripSystemEventLines(text: string): string {
  if (!text.startsWith("System: [")) {
    return text;
  }
  const lines = text.split(/\r?\n/);
  // Drop leading System: lines and any blank lines immediately after them
  let i = 0;
  while (i < lines.length && SYSTEM_EVENT_LINE.test(lines[i])) {
    i++;
  }
  // Skip blank lines between system block and actual content
  while (i < lines.length && lines[i].trim() === "") {
    i++;
  }
  return i === 0 ? text : lines.slice(i).join("\n");
}

export function stripMessageIdHints(text: string): string {
  if (!text.includes("[message_id:")) {
    return text;
  }
  const lines = text.split(/\r?\n/);
  const filtered = lines.filter((line) => !MESSAGE_ID_LINE.test(line));
  return filtered.length === lines.length ? text : filtered.join("\n");
}
