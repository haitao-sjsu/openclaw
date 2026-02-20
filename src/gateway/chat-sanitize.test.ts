import { describe, expect, test } from "vitest";
import { stripEnvelopeFromMessage } from "./chat-sanitize.js";

describe("stripEnvelopeFromMessage", () => {
  test("removes message_id hint lines from user messages", () => {
    const input = {
      role: "user",
      content: "[WhatsApp 2026-01-24 13:36] yolo\n[message_id: 7b8b]",
    };
    const result = stripEnvelopeFromMessage(input) as { content?: string };
    expect(result.content).toBe("yolo");
  });

  test("removes message_id hint lines from text content arrays", () => {
    const input = {
      role: "user",
      content: [{ type: "text", text: "hi\n[message_id: abc123]" }],
    };
    const result = stripEnvelopeFromMessage(input) as {
      content?: Array<{ type: string; text?: string }>;
    };
    expect(result.content?.[0]?.text).toBe("hi");
  });

  test("does not strip inline message_id text that is part of a line", () => {
    const input = {
      role: "user",
      content: "I typed [message_id: 123] on purpose",
    };
    const result = stripEnvelopeFromMessage(input) as { content?: string };
    expect(result.content).toBe("I typed [message_id: 123] on purpose");
  });

  test("should strip 'Conversation info' untrusted metadata block", () => {
    const input = {
      role: "user",
      content:
        'Conversation info (untrusted metadata):\n```json\n{"message_id": "abc", "sender": "+1234"}\n```\n\nHello',
    };
    const result = stripEnvelopeFromMessage(input) as { content?: string };
    expect(result.content?.trim()).toBe("Hello");
  });

  test("should strip 'Sender' untrusted metadata block", () => {
    const input = {
      role: "user",
      content:
        'Sender (untrusted metadata):\n```json\n{"label": "Alice", "name": "Alice"}\n```\n\nHi there',
    };
    const result = stripEnvelopeFromMessage(input) as { content?: string };
    expect(result.content?.trim()).toBe("Hi there");
  });

  test("should strip multiple untrusted metadata blocks together", () => {
    const input = {
      role: "user",
      content: [
        'Conversation info (untrusted metadata):\n```json\n{"message_id": "x"}\n```\n\nSender (untrusted metadata):\n```json\n{"label": "Bob"}\n```\n\nThread starter (untrusted, for context):\n```json\n{"body": "original post"}\n```\n\nWhat do you think?',
      ].join(""),
    };
    const result = stripEnvelopeFromMessage(input) as { content?: string };
    expect(result.content?.trim()).toBe("What do you think?");
  });

  test("should strip System event lines from user messages", () => {
    const input = {
      role: "user",
      content: "System: [2026-02-20 11:15:40 PST] WhatsApp gateway connected.\n\nHello",
    };
    const result = stripEnvelopeFromMessage(input) as { content?: string };
    expect(result.content).toBe("Hello");
  });

  test("should strip multiple System event lines", () => {
    const input = {
      role: "user",
      content:
        "System: [2026-02-20 11:15:40 PST] WhatsApp gateway connected.\nSystem: [2026-02-20 11:15:41 PST] Telegram bot started.\n\nHow are you?",
    };
    const result = stripEnvelopeFromMessage(input) as { content?: string };
    expect(result.content).toBe("How are you?");
  });

  test("should strip System lines + untrusted blocks + envelope together", () => {
    const input = {
      role: "user",
      content:
        'System: [2026-02-20 11:15:40 PST] WhatsApp gateway connected.\n\n[WhatsApp 2026-02-20 11:16] Conversation info (untrusted metadata):\n```json\n{"message_id": "abc"}\n```\n\nHi',
    };
    const result = stripEnvelopeFromMessage(input) as { content?: string };
    expect(result.content?.trim()).toBe("Hi");
  });

  test("does not strip assistant messages", () => {
    const input = {
      role: "assistant",
      content: "note\n[message_id: 123]",
    };
    const result = stripEnvelopeFromMessage(input) as { content?: string };
    expect(result.content).toBe("note\n[message_id: 123]");
  });
});
