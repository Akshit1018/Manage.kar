import "package:flutter_test/flutter_test.dart";
import "package:managekar/src/util/format.dart";

void main() {
  test("empty workspace scores 0", () {
    expect(
      productivityScore(doneTasks: 0, totalTasks: 0, habitsDone: 0, totalHabits: 0),
      0,
    );
  });

  test("all tasks and habits done scores 100", () {
    expect(
      productivityScore(doneTasks: 2, totalTasks: 2, habitsDone: 1, totalHabits: 1),
      100,
    );
  });
}
