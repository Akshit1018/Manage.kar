import "dart:io";

Future<String> readTextFile(String path) {
  return File(path).readAsString();
}
