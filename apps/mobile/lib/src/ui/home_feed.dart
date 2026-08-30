import "package:managekar/src/state/dialer.dart";

const homePreviewLimit = 4;
const homeChatPreviewLimit = 3;

String homeGreeting(String? name) {
  final trimmed = (name ?? "").trim();
  if (trimmed.isEmpty || trimmed == "User") {
    return "Today";
  }
  return "Hello, $trimmed";
}

String agentDaySumUp({
  required int doingCount,
  required int todayCount,
  required bool paired,
}) {
  if (doingCount > 0) {
    return "$doingCount in progress today.";
  }
  if (todayCount > 0) {
    return "$todayCount due today.";
  }
  if (paired) {
    return "Paired. Nothing running.";
  }
  return "Nothing running yet.";
}

String _briefingTaskPicture({required int doingCount, required int todayCount}) {
  if (doingCount > 0 && todayCount > 0) {
    return "$doingCount in progress, $todayCount due today.";
  }
  if (doingCount > 0) {
    return "$doingCount in progress today.";
  }
  if (todayCount > 0) {
    return "$todayCount due today.";
  }
  return "No tasks are in progress, and nothing is due today.";
}

String _joinBriefing(List<String> parts) {
  return parts.where((part) => part.trim().isNotEmpty).join("\n\n");
}

bool showHomeListPreview(int count) => count > 0;

bool chatHasHomePreview(ChatListItem item) {
  final preview = item.preview.trim();
  return preview.isNotEmpty && preview != "No messages yet" && preview != "Start a conversation";
}

String agentDayBriefing({
  required int doingCount,
  required int todayCount,
  required bool paired,
  String? thinkingTitle,
  String? approvalTitle,
  String? agentTitle,
  bool agentIsDemo = false,
}) {
  final tasks = _briefingTaskPicture(doingCount: doingCount, todayCount: todayCount);
  final title = agentTitle?.trim() ?? "";
  if (thinkingTitle != null && thinkingTitle.isNotEmpty) {
    return _joinBriefing([
      "$thinkingTitle is thinking right now.",
      "$tasks I will rewrite this every time you open the app.",
    ]);
  }
  if (approvalTitle != null && approvalTitle.isNotEmpty) {
    return _joinBriefing(["$approvalTitle is waiting for an approval.", "Open that chat when you can decide."]);
  }
  if (doingCount > 0 || todayCount > 0) {
    return _joinBriefing([tasks, "I will rewrite this every time you open the app."]);
  }
  if (paired) {
    return _joinBriefing([
      "You are paired. Nothing is running right now.",
      "I will rewrite this every time you open the app.",
    ]);
  }
  if (title.isNotEmpty && agentIsDemo) {
    return _joinBriefing([
      "Nothing is moving yet.",
      "$title is here as a demo on this phone. Add a task or pair Hermes and I will brief you here.",
    ]);
  }
  return _joinBriefing(["Nothing is moving yet.", "Add a task or pair Hermes and I will brief you here."]);
}

List<DialerSession> homeAgents(List<DialerSession> sessions) {
  final bots = sessions.where((session) => session.title == "Bot Chat").toList();
  if (bots.isNotEmpty) {
    return bots;
  }
  return sessions;
}

String agentInitials(String title) {
  if (title == "Bot Chat") {
    return "B";
  }
  final words = title.split(RegExp(r"\s+")).where((word) => RegExp(r"[A-Za-z0-9]").hasMatch(word)).toList();
  if (words.isEmpty) {
    return "?";
  }
  if (words.length >= 2) {
    return "${words[0][0]}${words[1][0]}".toUpperCase();
  }
  return words[0][0].toUpperCase();
}

String agentCaption(DialerSession session) => session.source == "demo" ? "Demo" : "Paired";

List<ChatListItem> homeChatPreview(List<ChatListItem> chats, {String? excludeId}) {
  return chats
      .where((item) => item.id != newChatTarget && item.id != excludeId && chatHasHomePreview(item))
      .take(homeChatPreviewLimit)
      .toList();
}

List<Map<String, dynamic>> homeTaskPreview(List<Map<String, dynamic>> tasks) {
  final open = tasks.where((task) => task["completed"] != true).toList();
  open.sort((left, right) {
    final leftDoing = left["status"] == "doing" ? 0 : 1;
    final rightDoing = right["status"] == "doing" ? 0 : 1;
    return leftDoing - rightDoing;
  });
  return open.take(homePreviewLimit).toList();
}

List<Map<String, dynamic>> homeNotePreview(List<Map<String, dynamic>> notes) {
  final next = [...notes];
  next.sort((left, right) {
    final leftPin = left["pinned"] == true ? 1 : 0;
    final rightPin = right["pinned"] == true ? 1 : 0;
    return rightPin - leftPin;
  });
  return next.take(homePreviewLimit).toList();
}

List<Map<String, dynamic>> homeHabitPreview(List<Map<String, dynamic>> habits) {
  final next = [...habits];
  next.sort((left, right) {
    final leftDone = left["completedToday"] == true ? 1 : 0;
    final rightDone = right["completedToday"] == true ? 1 : 0;
    return leftDone - rightDone;
  });
  return next.take(homePreviewLimit).toList();
}

String taskProgressDetail(Map<String, dynamic> task) {
  final checklist = task["checklist"];
  if (checklist is List && checklist.isNotEmpty) {
    final done = checklist.where((item) => item is Map && item["completed"] == true).length;
    return "$done/${checklist.length} checklist";
  }
  switch (task["status"]) {
    case "doing":
      return "In progress";
    case "done":
      return "Done";
    default:
      return "To do";
  }
}
