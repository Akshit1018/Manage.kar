import "package:flutter/foundation.dart";
import "package:managekar/src/api/api_client.dart";

class WorkspaceController extends ChangeNotifier {
  WorkspaceController(this.api);

  final ApiClient api;
  Map<String, dynamic> data = {};
  bool loading = false;
  String? error;

  List<dynamic> get tasks => data["tasks"] as List<dynamic>? ?? [];
  List<dynamic> get notes => data["notes"] as List<dynamic>? ?? [];
  List<dynamic> get habits => data["habits"] as List<dynamic>? ?? [];
  List<dynamic> get goals => data["goals"] as List<dynamic>? ?? [];
  List<dynamic> get timeEntries => data["timeEntries"] as List<dynamic>? ?? [];
  Map<String, dynamic>? get settings => data["settings"] as Map<String, dynamic>?;
  Map<String, dynamic>? get user => data["user"] as Map<String, dynamic>?;
  Map<String, dynamic>? get activeFocus => data["activeFocus"] as Map<String, dynamic>?;

  Future<void> refresh() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      data = await api.workspace();
    } catch (err) {
      error = err.toString();
    }
    loading = false;
    notifyListeners();
  }

  Future<void> saveTask(Map<String, dynamic> payload, {String? id}) async {
    if (id == null) {
      await api.post("/api/tasks", payload);
    } else {
      await api.patch("/api/tasks/$id", payload);
    }
    await refresh();
  }

  Future<void> deleteTask(String id) async {
    await api.delete("/api/tasks/$id");
    await refresh();
  }

  Future<void> saveNote(Map<String, dynamic> payload, {String? id}) async {
    if (id == null) {
      await api.post("/api/notes", payload);
    } else {
      await api.patch("/api/notes/$id", payload);
    }
    await refresh();
  }

  Future<void> attachVoice(String noteId, String transcription, int duration) async {
    await api.post("/api/notes/$noteId/voice", {
      "transcription": transcription,
      "duration": duration,
      "stored": true,
    });
    await refresh();
  }

  Future<void> deleteNote(String id) async {
    await api.delete("/api/notes/$id");
    await refresh();
  }

  Future<void> saveHabit(Map<String, dynamic> payload, {String? id}) async {
    if (id == null) {
      await api.post("/api/habits", payload);
    } else {
      await api.patch("/api/habits/$id", payload);
    }
    await refresh();
  }

  Future<void> toggleHabit(String id) async {
    await api.post("/api/habits/$id/toggle", {});
    await refresh();
  }

  Future<void> saveGoal(Map<String, dynamic> payload) async {
    await api.post("/api/goals", payload);
    await refresh();
  }

  Future<void> addMilestone(String goalId, String title) async {
    await api.post("/api/goals/$goalId/milestones", {"title": title});
    await refresh();
  }

  Future<void> startTimer(String taskName, String project) async {
    await api.post("/api/time-entries", {"taskName": taskName, "project": project});
    await refresh();
  }

  Future<void> stopTimer(String id) async {
    await api.post("/api/time-entries/$id/stop", {});
    await refresh();
  }

  Future<void> startFocus(String type, int minutes) async {
    await api.post("/api/focus/start", {"type": type, "durationMinutes": minutes});
    await refresh();
  }

  Future<void> stopFocus() async {
    await api.post("/api/focus/stop", {});
    await refresh();
  }

  Future<void> saveProfile(Map<String, dynamic> payload) async {
    await api.patch("/api/me", payload);
    await refresh();
  }
}
