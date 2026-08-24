import "package:flutter/foundation.dart";
import "package:managekar/src/api/api_client.dart";

class SessionController extends ChangeNotifier {
  SessionController(this.api);

  final ApiClient api;
  Map<String, dynamic>? user;
  String? error;
  bool busy = false;

  Future<bool> restore() async {
    await api.attachToken();
    if (api.dio.options.headers["Authorization"] == null) {
      return false;
    }
    try {
      final data = await api.workspace();
      user = data["user"] as Map<String, dynamic>?;
      notifyListeners();
      return user != null;
    } catch (_) {
      await api.clearToken();
      return false;
    }
  }

  Future<bool> register(String email, String password, String name) {
    return _auth(() => api.register(email, password, name));
  }

  Future<bool> login(String email, String password) {
    return _auth(() => api.login(email, password));
  }

  Future<bool> _auth(Future<Map<String, dynamic>> Function() run) async {
    busy = true;
    error = null;
    notifyListeners();
    try {
      final data = await run();
      await api.saveToken(data["token"] as String);
      user = data["user"] as Map<String, dynamic>?;
      busy = false;
      notifyListeners();
      return true;
    } catch (err) {
      error = err.toString().replaceFirst("DioException [unknown]: ", "");
      busy = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await api.clearToken();
    user = null;
    notifyListeners();
  }
}
