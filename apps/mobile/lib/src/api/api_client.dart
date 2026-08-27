import "package:dio/dio.dart";
import "package:flutter/foundation.dart";
import "package:flutter_secure_storage/flutter_secure_storage.dart";

String defaultApiBase() {
  const fromEnv = String.fromEnvironment("API_BASE", defaultValue: "");
  if (fromEnv.isNotEmpty) {
    return fromEnv;
  }
  if (kIsWeb) {
    return Uri.base.origin;
  }
  return "http://127.0.0.1:4000";
}

class ApiClient {
  ApiClient({String? baseUrl})
      : dio = Dio(
          BaseOptions(
            baseUrl: baseUrl ?? defaultApiBase(),
            connectTimeout: const Duration(seconds: 12),
            receiveTimeout: const Duration(seconds: 30),
          ),
        );

  final Dio dio;
  final FlutterSecureStorage storage = const FlutterSecureStorage(webOptions: WebOptions());

  Future<void> attachToken() async {
    try {
      final token = await storage.read(key: "token");
      if (token == null) {
        dio.options.headers.remove("Authorization");
      } else {
        dio.options.headers["Authorization"] = "Bearer $token";
      }
    } catch (_) {
      dio.options.headers.remove("Authorization");
    }
  }

  Future<void> saveToken(String token) async {
    await storage.write(key: "token", value: token);
    dio.options.headers["Authorization"] = "Bearer $token";
  }

  Future<void> clearToken() async {
    await storage.delete(key: "token");
    dio.options.headers.remove("Authorization");
  }

  Future<Map<String, dynamic>> register(String email, String password, String name) async {
    final response = await dio.post<Map<String, dynamic>>(
      "/api/auth/register",
      data: {"email": email, "password": password, "name": name},
    );
    return response.data!;
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await dio.post<Map<String, dynamic>>(
      "/api/auth/login",
      data: {"email": email, "password": password},
    );
    return response.data!;
  }

  Future<Map<String, dynamic>> workspace() async {
    await attachToken();
    final response = await dio.get<Map<String, dynamic>>("/api/workspace");
    return response.data!;
  }

  Future<Map<String, dynamic>> exportBackup() async {
    await attachToken();
    final response = await dio.get<Map<String, dynamic>>("/api/export");
    return response.data!;
  }

  Future<void> importBackup(Map<String, dynamic> backup) async {
    await attachToken();
    await dio.post<Map<String, dynamic>>("/api/import", data: backup);
  }

  Future<void> clearWorkspace() async {
    await attachToken();
    await dio.delete<void>("/api/workspace");
  }

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> data) async {
    await attachToken();
    final response = await dio.post<Map<String, dynamic>>(path, data: data);
    return response.data!;
  }

  Future<Map<String, dynamic>> patch(String path, Map<String, dynamic> data) async {
    await attachToken();
    final response = await dio.patch<Map<String, dynamic>>(path, data: data);
    return response.data!;
  }

  Future<void> delete(String path) async {
    await attachToken();
    await dio.delete<void>(path);
  }

  Future<Map<String, dynamic>> uploadVoice(
    String noteId,
    String filePath, {
    String transcription = "",
    int duration = 0,
  }) async {
    await attachToken();
    final audio = kIsWeb
        ? MultipartFile.fromBytes(await _bytesFromPath(filePath), filename: "note.webm")
        : await MultipartFile.fromFile(filePath, filename: "note.m4a");
    final form = FormData.fromMap({
      "transcription": transcription,
      "duration": duration,
      "audio": audio,
    });
    final response = await dio.post<Map<String, dynamic>>("/api/notes/$noteId/voice", data: form);
    return response.data!;
  }

  Future<List<int>> _bytesFromPath(String filePath) async {
    final response = await Dio().get<List<int>>(
      filePath,
      options: Options(responseType: ResponseType.bytes),
    );
    return response.data ?? [];
  }

  Future<List<int>> downloadVoice(String noteId) async {
    await attachToken();
    final response = await dio.get<List<int>>(
      "/api/notes/$noteId/voice",
      options: Options(responseType: ResponseType.bytes),
    );
    return response.data ?? [];
  }
}
