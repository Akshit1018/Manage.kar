import "package:flutter/foundation.dart";
import "package:managekar/src/api/api_client.dart";
import "package:managekar/src/util/format.dart";

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
  List<dynamic> get focusSessions => data["focusSessions"] as List<dynamic>? ?? [];
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

  Future<void> _run(Future<void> Function() action) async {
    error = null;
    try {
      await action();
      await refresh();
    } catch (err) {
      error = err.toString();
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>?> saveTask(Map<String, dynamic> payload, {String? id}) async {
    Map<String, dynamic>? saved;
    await _run(() async {
      saved = id == null ? await api.post("/api/tasks", payload) : await api.patch("/api/tasks/$id", payload);
    });
    return saved;
  }

  Future<void> toggleTask(Map<String, dynamic> task) {
    return _run(() => api.patch("/api/tasks/${task["id"]}", {"completed": task["completed"] != true}));
  }

  Future<void> deleteTask(String id) => _run(() => api.delete("/api/tasks/$id"));

  Future<Map<String, dynamic>?> saveNote(Map<String, dynamic> payload, {String? id}) async {
    Map<String, dynamic>? saved;
    await _run(() async {
      saved = id == null ? await api.post("/api/notes", payload) : await api.patch("/api/notes/$id", payload);
    });
    return saved;
  }

  Future<void> attachVoice(String noteId, String transcription, int duration) {
    return _run(() => api.post("/api/notes/$noteId/voice", {
          "transcription": transcription,
          "duration": duration,
          "stored": true,
        }));
  }

  Future<void> uploadVoiceFile(String noteId, String path, {String transcription = "", int duration = 0}) {
    return _run(() => api.uploadVoice(noteId, path, transcription: transcription, duration: duration));
  }

  Future<void> deleteNote(String id) => _run(() => api.delete("/api/notes/$id"));

  Future<void> saveHabit(Map<String, dynamic> payload, {String? id}) {
    return _run(() => id == null ? api.post("/api/habits", payload) : api.patch("/api/habits/$id", payload));
  }

  Future<void> toggleHabit(String id) => _run(() => api.post("/api/habits/$id/toggle", {}));

  Future<void> deleteHabit(String id) => _run(() => api.delete("/api/habits/$id"));

  Future<void> saveGoal(Map<String, dynamic> payload, {String? id}) {
    return _run(() => id == null ? api.post("/api/goals", payload) : api.patch("/api/goals/$id", payload));
  }

  Future<void> deleteGoal(String id) => _run(() => api.delete("/api/goals/$id"));

  Future<void> addMilestone(String goalId, String title, {String dueDate = ""}) {
    return _run(() => api.post("/api/goals/$goalId/milestones", {"title": title, "dueDate": dueDate}));
  }

  Future<void> toggleMilestone(String goalId, Map<String, dynamic> milestone) {
    return _run(() => api.patch("/api/goals/$goalId/milestones/${milestone["id"]}", {
          "completed": milestone["completed"] != true,
        }));
  }

  Future<void> startTimer(String taskName, String project) {
    return _run(() => api.post("/api/time-entries", {"taskName": taskName, "project": project}));
  }

  Future<void> pauseTimer(String id) => _run(() => api.post("/api/time-entries/$id/pause", {}));

  Future<void> resumeTimer(String id) => _run(() => api.post("/api/time-entries/$id/resume", {}));

  Future<void> stopTimer(String id) => _run(() => api.post("/api/time-entries/$id/stop", {}));

  Future<void> startFocus(String type, int minutes) {
    return _run(() => api.post("/api/focus/start", {"type": type, "durationMinutes": minutes}));
  }

  Future<void> pauseFocus() => _run(() => api.post("/api/focus/pause", {}));

  Future<void> resumeFocus() => _run(() => api.post("/api/focus/resume", {}));

  Future<void> stopFocus() => _run(() => api.post("/api/focus/stop", {}));

  Future<void> saveProfile(Map<String, dynamic> payload) => _run(() => api.patch("/api/me", payload));

  Future<Map<String, dynamic>> exportBackup() => api.exportBackup();

  Future<void> importBackup(Map<String, dynamic> backup) => _run(() => api.importBackup(backup));

  Future<void> clearWorkspace() => _run(api.clearWorkspace);

  List<Map<String, dynamic>> dueToday() {
    return tasks.whereType<Map>().map(asMap).where((task) {
      return task["completed"] != true && task["dueDate"] == todayKey();
    }).toList();
  }
}
