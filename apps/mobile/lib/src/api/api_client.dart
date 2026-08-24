import "package:dio/dio.dart";
import "package:flutter_secure_storage/flutter_secure_storage.dart";

class ApiClient {
  ApiClient({String? baseUrl})
      : dio = Dio(
          BaseOptions(
            baseUrl: baseUrl ??
                const String.fromEnvironment("API_BASE", defaultValue: "http://127.0.0.1:4000"),
            connectTimeout: const Duration(seconds: 12),
            receiveTimeout: const Duration(seconds: 20),
          ),
        );

  final Dio dio;
  final FlutterSecureStorage storage = const FlutterSecureStorage();

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

  Future<List<dynamic>> list(String path) async {
    await attachToken();
    final response = await dio.get<List<dynamic>>(path);
    return response.data ?? [];
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
}
