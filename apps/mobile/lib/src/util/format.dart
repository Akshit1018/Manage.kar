String formatClock(int seconds) {
  final safe = seconds < 0 ? 0 : seconds;
  final mins = safe ~/ 60;
  final secs = safe % 60;
  return "${mins.toString().padLeft(2, "0")}:${secs.toString().padLeft(2, "0")}";
}

String formatDurationMs(int milliseconds) {
  final seconds = (milliseconds / 1000).floor().clamp(0, 24 * 3600);
  final hours = seconds ~/ 3600;
  final minutes = (seconds % 3600) ~/ 60;
  final secs = seconds % 60;
  return "${hours.toString().padLeft(2, "0")}:${minutes.toString().padLeft(2, "0")}:${secs.toString().padLeft(2, "0")}";
}

String todayKey() {
  final now = DateTime.now();
  return "${now.year.toString().padLeft(4, "0")}-${now.month.toString().padLeft(2, "0")}-${now.day.toString().padLeft(2, "0")}";
}

int productivityScore({
  required int doneTasks,
  required int totalTasks,
  required int habitsDone,
  required int totalHabits,
}) {
  final taskPart = (doneTasks / (totalTasks == 0 ? 1 : totalTasks)) * 50;
  final habitPart = (habitsDone / (totalHabits == 0 ? 1 : totalHabits)) * 50;
  return (taskPart + habitPart).round();
}

Map<String, dynamic> asMap(dynamic raw) {
  if (raw is Map<String, dynamic>) {
    return raw;
  }
  if (raw is Map) {
    return Map<String, dynamic>.from(raw);
  }
  return {};
}
