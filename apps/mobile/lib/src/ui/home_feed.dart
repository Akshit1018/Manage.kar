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

String? _briefingAgentPicture({String? agentTitle, required bool paired, required bool agentIsDemo}) {
  final title = agentTitle?.trim() ?? "";
  if (title.isEmpty) {
    return null;
  }
  if (agentIsDemo) {
    return "$title is here as a demo. It is not paired to a machine, so I can only brief what is on this phone.";
  }
  if (paired) {
    return "$title is paired.";
  }
  return "$title is on this phone.";
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
  final agent = _briefingAgentPicture(agentTitle: agentTitle, paired: paired, agentIsDemo: agentIsDemo);
  if (thinkingTitle != null && thinkingTitle.isNotEmpty) {
    return [thinkingTitle + " is thinking right now.", tasks, "I will rewrite this every time you open the app."].join("\n\n");
  }
  if (approvalTitle != null && approvalTitle.isNotEmpty) {
    return [approvalTitle + " is waiting for an approval.", tasks, "Open that chat when you can decide."].join("\n\n");
  }
  if (doingCount > 0 || todayCount > 0) {
    return [tasks, if (agent != null) agent, "I will rewrite this every time you open the app."].join("\n\n");
  }
  if (paired) {
    return [
      "You are paired. Nothing is running right now.",
      tasks,
      if (agent != null) agent,
      "I will rewrite this every time you open the app.",
    ].join("\n\n");
  }
  return [
    "Nothing is moving yet.",
    tasks,
    if (agent != null) agent,
    "Add a task or pair Hermes and I will brief you here like a desk assistant.",
  ].join("\n\n");
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
  return chats.where((item) => item.id != newChatTarget && item.id != excludeId).take(homeChatPreviewLimit).toList();
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
