import "dart:convert";

import "package:flutter/foundation.dart";
import "package:shared_preferences/shared_preferences.dart";

/// The permanent first entry of every session list: a brand-new chat.
const newChatTarget = "new-chat";

const dialerPrefsKey = "managekar.dialer.v1";

const _demoIds = {"demo-local", "demo-vps", "demo-research"};

class DialerSession {
  const DialerSession({
    required this.id,
    required this.title,
    required this.presence,
    required this.lastActivityAt,
    required this.source,
  });

  final String id;
  final String title;

  /// "active" | "idle" | "offline"
  final String presence;
  final String lastActivityAt;

  /// "demo" | "paired"
  final String source;

  Map<String, Object?> toJson() => {
        "id": id,
        "title": title,
        "presence": presence,
        "lastActivityAt": lastActivityAt,
        "source": source,
      };

  static DialerSession? fromJson(Object? value) {
    if (value is! Map) {
      return null;
    }
    final id = value["id"];
    final title = value["title"];
    if (id is! String || title is! String || id.trim().isEmpty || id == newChatTarget) {
      return null;
    }
    final presence = value["presence"];
    final source = value["source"];
    return DialerSession(
      id: id,
      title: title,
      presence: presence == "active" || presence == "idle" ? presence as String : "offline",
      lastActivityAt: value["lastActivityAt"] is String
          ? value["lastActivityAt"] as String
          : DateTime.fromMillisecondsSinceEpoch(0, isUtc: true).toIso8601String(),
      source: source == "demo" || _demoIds.contains(id) ? "demo" : "paired",
    );
  }
}

class OutboxMessage {
  const OutboxMessage({
    required this.id,
    required this.target,
    required this.text,
    required this.createdAt,
    required this.status,
    this.sentAt,
  });

  final int id;
  final String target;
  final String text;
  final String createdAt;

  /// "queued" | "sent"
  final String status;
  final String? sentAt;

  Map<String, Object?> toJson() => {
        "id": id,
        "target": target,
        "text": text,
        "createdAt": createdAt,
        "status": status,
        if (sentAt != null) "sentAt": sentAt,
      };

  static OutboxMessage? fromJson(Object? value) {
    if (value is! Map) {
      return null;
    }
    final id = value["id"];
    final target = value["target"];
    final text = value["text"];
    if (id is! int || target is! String || text is! String) {
      return null;
    }
    return OutboxMessage(
      id: id,
      target: target,
      text: text,
      createdAt: value["createdAt"] is String
          ? value["createdAt"] as String
          : DateTime.fromMillisecondsSinceEpoch(0, isUtc: true).toIso8601String(),
      status: value["status"] == "sent" ? "sent" : "queued",
      sentAt: value["sentAt"] is String ? value["sentAt"] as String : null,
    );
  }
}

class DialerState {
  const DialerState({required this.sessions, required this.outbox});

  DialerState.empty()
      : sessions = const [],
        outbox = const [];

  final List<DialerSession> sessions;
  final List<OutboxMessage> outbox;

  Map<String, Object?> toJson() => {
        "schemaVersion": 1,
        "sessions": sessions.map((session) => session.toJson()).toList(),
        "outbox": outbox.map((message) => message.toJson()).toList(),
      };

  static DialerState fromJson(Object? value) {
    if (value is! Map) {
      return DialerState.empty();
    }
    final sessions = value["sessions"];
    final outbox = value["outbox"];
    return DialerState(
      sessions: sessions is List
          ? sessions.map(DialerSession.fromJson).whereType<DialerSession>().toList()
          : const [],
      outbox: outbox is List
          ? outbox.map(OutboxMessage.fromJson).whereType<OutboxMessage>().toList()
          : const [],
    );
  }
}

/// Placeholder machines shown until Hermes pairing lands. Never persisted as paired.
List<DialerSession> demoSessions({DateTime? now}) {
  final base = now ?? DateTime.now().toUtc();
  String minutesAgo(int minutes) => base.subtract(Duration(minutes: minutes)).toIso8601String();
  return [
    DialerSession(
      id: "demo-local",
      title: "Hermes · local",
      presence: "active",
      lastActivityAt: minutesAgo(4),
      source: "demo",
    ),
    DialerSession(
      id: "demo-vps",
      title: "Hermes · VPS",
      presence: "idle",
      lastActivityAt: minutesAgo(35),
      source: "demo",
    ),
    DialerSession(
      id: "demo-research",
      title: "Research bot",
      presence: "offline",
      lastActivityAt: minutesAgo(60 * 26),
      source: "demo",
    ),
  ];
}

List<DialerSession> visibleSessions(DialerState state) {
  final paired = state.sessions.where((session) => session.source == "paired").toList();
  if (paired.isNotEmpty) {
    return paired;
  }
  if (state.sessions.isNotEmpty) {
    return state.sessions;
  }
  return demoSessions();
}

DialerSession? resolveSession(DialerState state, String target) {
  if (target == newChatTarget) {
    return null;
  }
  for (final session in state.sessions) {
    if (session.id == target) {
      return session;
    }
  }
  for (final session in demoSessions()) {
    if (session.id == target) {
      return session;
    }
  }
  return null;
}

class QueueResult {
  const QueueResult({required this.state, required this.message});

  final DialerState state;
  final OutboxMessage message;
}

QueueResult? queueMessage(
  DialerState state,
  String target,
  String text,
  String nowIso, {
  bool deliver = false,
}) {
  final trimmed = text.trim();
  if (trimmed.isEmpty) {
    return null;
  }
  final known = resolveSession(state, target);
  final sessions = known != null && !state.sessions.any((session) => session.id == known.id)
      ? [...state.sessions, known]
      : state.sessions;
  final deliverable = deliver && known != null && known.source == "paired" && known.presence == "active";
  final nextId = state.outbox.fold(0, (max, message) => message.id > max ? message.id : max) + 1;
  final message = OutboxMessage(
    id: nextId,
    target: target,
    text: trimmed,
    createdAt: nowIso,
    status: deliverable ? "sent" : "queued",
    sentAt: deliverable ? nowIso : null,
  );
  return QueueResult(
    state: DialerState(sessions: sessions, outbox: [...state.outbox, message]),
    message: message,
  );
}

String queueCopy({required String status, String? source, String? presence}) {
  if (source == "demo" || source == null) {
    return "Saved locally — will send after pairing";
  }
  if (status == "sent") {
    return "Sent";
  }
  return "Queued — sends when the agent is back online";
}

String targetTitle(List<DialerSession> sessions, String target) {
  for (final session in sessions) {
    if (session.id == target) {
      return session.title;
    }
  }
  return "New chat";
}

int queuedCountFor(DialerState state, String target) {
  return state.outbox.where((message) => message.target == target && message.status == "queued").length;
}

List<OutboxMessage> messagesForTarget(DialerState state, String target) {
  final rows = state.outbox.where((message) => message.target == target).toList()
    ..sort((a, b) {
      final byTime = a.createdAt.compareTo(b.createdAt);
      return byTime != 0 ? byTime : a.id.compareTo(b.id);
    });
  return rows;
}

class ChatListItem {
  const ChatListItem({
    required this.id,
    required this.title,
    required this.queuedCount,
    required this.preview,
    this.presence,
    this.source,
  });

  final String id;
  final String title;
  final int queuedCount;
  final String preview;
  final String? presence;
  final String? source;
}

List<ChatListItem> chatListItems(DialerState state) {
  final newChatRows = messagesForTarget(state, newChatTarget);
  final sessions = [...visibleSessions(state)]
    ..sort((a, b) => b.lastActivityAt.compareTo(a.lastActivityAt));
  return [
    ChatListItem(
      id: newChatTarget,
      title: "New chat",
      queuedCount: queuedCountFor(state, newChatTarget),
      preview: newChatRows.isEmpty ? "Start a conversation" : newChatRows.last.text,
    ),
    ...sessions.map((session) {
      final rows = messagesForTarget(state, session.id);
      return ChatListItem(
        id: session.id,
        title: session.title,
        presence: session.presence,
        source: session.source,
        queuedCount: queuedCountFor(state, session.id),
        preview: rows.isEmpty ? "No messages yet" : rows.last.text,
      );
    }),
  ];
}

/// Persistent controller wrapping the pure model with SharedPreferences storage.
class DialerController extends ChangeNotifier {
  DialerState state = DialerState.empty();
  bool hydrated = false;

  Future<void> hydrate() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(dialerPrefsKey);
    if (raw != null) {
      Object? parsed;
      try {
        parsed = jsonDecode(raw);
      } catch (_) {
        parsed = null;
      }
      state = DialerState.fromJson(parsed);
    }
    hydrated = true;
    notifyListeners();
  }

  Future<OutboxMessage?> send(String target, String text) async {
    final result = queueMessage(state, target, text, DateTime.now().toUtc().toIso8601String());
    if (result == null) {
      return null;
    }
    state = result.state;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(dialerPrefsKey, jsonEncode(state.toJson()));
    return result.message;
  }

  Future<void> clear() async {
    state = DialerState.empty();
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(dialerPrefsKey);
  }
}
