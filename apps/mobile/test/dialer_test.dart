import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";
import "package:managekar/src/screens/chats_screen.dart";
import "package:managekar/src/state/dialer.dart";

DialerSession session({
  String id = "s1",
  String title = "Hermes local",
  String presence = "active",
  String lastActivityAt = "2026-08-28T09:00:00.000Z",
  String source = "paired",
}) {
  return DialerSession(
    id: id,
    title: title,
    presence: presence,
    lastActivityAt: lastActivityAt,
    source: source,
  );
}

void main() {
  group("demo sessions", () {
    test("are shown only until a paired machine exists", () {
      final empty = DialerState.empty();
      expect(visibleSessions(empty).map((s) => s.id), ["demo-local", "demo-vps", "demo-research"]);
      expect(visibleSessions(empty).every((s) => s.source == "demo"), isTrue);

      final paired = DialerState(sessions: [session(id: "real")], outbox: const []);
      expect(visibleSessions(paired).map((s) => s.id), ["real"]);
    });
  });

  group("queueMessage", () {
    test("queues for offline and idle sessions and trims text", () {
      final state = DialerState(sessions: [session(presence: "offline")], outbox: const []);
      final result = queueMessage(state, "s1", "  hello agent  ", "2026-08-28T10:00:00.000Z");
      expect(result, isNotNull);
      expect(result!.message.status, "queued");
      expect(result.message.text, "hello agent");
    });

    test("never marks sent without an explicit transport ack", () {
      final state = DialerState(sessions: [session(presence: "active")], outbox: const []);
      final result = queueMessage(state, "s1", "hi", "2026-08-28T10:00:00.000Z");
      expect(result!.message.status, "queued");
      expect(result.message.sentAt, isNull);
    });

    test("marks sent only when caller confirms delivery on a paired active session", () {
      final state = DialerState(sessions: [session(presence: "active")], outbox: const []);
      final result = queueMessage(state, "s1", "hi", "2026-08-28T10:00:00.000Z", deliver: true);
      expect(result!.message.status, "sent");
      expect(result.message.sentAt, "2026-08-28T10:00:00.000Z");
    });

    test("demo sessions are never delivered even with deliver flag", () {
      final result = queueMessage(DialerState.empty(), "demo-local", "hi", "2026-08-28T10:00:00.000Z", deliver: true);
      expect(result!.message.status, "queued");
      expect(result.state.sessions.singleWhere((s) => s.id == "demo-local").source, "demo");
    });

    test("rejects empty text and allocates increasing ids", () {
      expect(queueMessage(DialerState.empty(), newChatTarget, "   ", "2026-08-28T10:00:00.000Z"), isNull);
      final first = queueMessage(DialerState.empty(), newChatTarget, "one", "2026-08-28T10:00:00.000Z")!;
      final second = queueMessage(first.state, newChatTarget, "two", "2026-08-28T10:01:00.000Z")!;
      expect(second.message.id, greaterThan(first.message.id));
    });
  });

  group("presence words", () {
    test("demo stays not paired and paired maps to reachable / asleep / unreachable", () {
      expect(presenceLabel("active", "demo"), "not paired");
      expect(presenceLabel("idle", "demo"), "not paired");
      expect(presenceLabel("offline", "demo"), "not paired");
      expect(presenceLabel("active", "paired"), "reachable");
      expect(presenceLabel("idle", "paired"), "asleep");
      expect(presenceLabel("offline", "paired"), "unreachable");
      expect(presenceColor("active", "demo"), isNot(const Color(0xFF10B981)));
    });
  });

  group("honest copy", () {
    test("demo and unpaired messages say pairing, paired queued says reachable, acked says sent", () {
      expect(queueCopy(status: "queued", source: "demo"), contains("pairing"));
      expect(queueCopy(status: "sent", source: "demo"), contains("pairing"));
      expect(queueCopy(status: "queued", source: "paired", presence: "offline"), contains("reachable"));
      expect(queueCopy(status: "queued", source: "paired", presence: "offline"), isNot(contains("online")));
      expect(queueCopy(status: "sent", source: "paired"), "Sent");
      expect(queueCopy(status: "queued"), contains("pairing"));
    });
  });

  group("chat list", () {
    test("puts New chat first then sessions by latest activity with queued counts and previews", () {
      var state = DialerState(
        sessions: [
          session(id: "old", title: "Old", lastActivityAt: "2026-08-01T00:00:00.000Z"),
          session(id: "fresh", title: "Fresh", lastActivityAt: "2026-08-28T00:00:00.000Z"),
        ],
        outbox: const [],
      );
      state = queueMessage(state, "old", "later", "2026-08-28T10:00:00.000Z")!.state;
      state = queueMessage(state, newChatTarget, "start", "2026-08-28T09:00:00.000Z")!.state;
      final items = chatListItems(state);
      expect(items.map((i) => i.id), [newChatTarget, "fresh", "old"]);
      expect(items.first.queuedCount, 1);
      expect(items.last.queuedCount, 1);
      expect(items.last.preview, "later");
    });

    test("messagesForTarget returns rows for one target in time order", () {
      var state = DialerState.empty();
      state = queueMessage(state, newChatTarget, "one", "2026-08-28T10:00:00.000Z")!.state;
      state = queueMessage(state, "s1", "skip", "2026-08-28T10:01:00.000Z")!.state;
      state = queueMessage(state, newChatTarget, "two", "2026-08-28T10:02:00.000Z")!.state;
      expect(messagesForTarget(state, newChatTarget).map((m) => m.text), ["one", "two"]);
    });
  });

  group("persistence round trip", () {
    test("serializes and parses without inventing sessions", () {
      var state = DialerState.empty();
      state = queueMessage(state, newChatTarget, "hello", "2026-08-28T10:00:00.000Z")!.state;
      final parsed = DialerState.fromJson(state.toJson());
      expect(parsed.sessions, isEmpty);
      expect(parsed.outbox.single.text, "hello");
    });

    test("parses garbage into an empty state", () {
      final parsed = DialerState.fromJson({"sessions": "nope", "outbox": 42});
      expect(parsed.sessions, isEmpty);
      expect(parsed.outbox, isEmpty);
    });

    test("re-tags leftover demo ids as demo and drops new-chat impostors", () {
      final parsed = DialerState.fromJson({
        "sessions": [
          {"id": "demo-local", "title": "Hermes · local", "presence": "active"},
          {"id": newChatTarget, "title": "Hijack", "presence": "active"},
        ],
        "outbox": <Object>[],
      });
      expect(parsed.sessions.single.id, "demo-local");
      expect(parsed.sessions.single.source, "demo");
    });
  });
}
