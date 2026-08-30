import "package:flutter_test/flutter_test.dart";
import "package:managekar/src/state/dialer.dart";
import "package:managekar/src/ui/home_feed.dart";

void main() {
  test("greets unnamed profiles as Today", () {
    expect(homeGreeting(""), "Today");
    expect(homeGreeting("User"), "Today");
    expect(homeGreeting("Ada"), "Hello, Ada");
  });

  test("lists Bot Chat agents first and initials HL for machine titles", () {
    final bot = DialerSession(
      id: "demo-research",
      title: "Bot Chat",
      presence: "offline",
      lastActivityAt: "2026-08-29T00:00:00.000Z",
      source: "demo",
    );
    final machine = DialerSession(
      id: "demo-local",
      title: "Hermes · local",
      presence: "active",
      lastActivityAt: "2026-08-29T00:01:00.000Z",
      source: "demo",
    );
    expect(homeAgents([machine, bot]).map((item) => item.id), ["demo-research"]);
    expect(agentInitials("Bot Chat"), "B");
    expect(agentInitials("Hermes · local"), "HL");
    expect(agentCaption(bot), "Demo");
  });

  test("writes an honest day sum-up", () {
    expect(agentDaySumUp(doingCount: 2, todayCount: 3, paired: false), "2 in progress today.");
    expect(agentDaySumUp(doingCount: 0, todayCount: 1, paired: false), "1 due today.");
    expect(agentDaySumUp(doingCount: 0, todayCount: 0, paired: true), "Paired. Nothing running.");
    expect(agentDaySumUp(doingCount: 0, todayCount: 0, paired: false), "Nothing running yet.");
  });

  test("writes a short PA briefing without Hello", () {
    final emptyDemo = agentDayBriefing(
      doingCount: 0,
      todayCount: 0,
      paired: false,
      agentTitle: "Bot Chat",
      agentIsDemo: true,
    );
    expect(
      emptyDemo,
      "Nothing is moving yet.\n\nBot Chat is here as a demo on this phone. Add a task or pair Hermes and I will brief you here.",
    );
    expect(emptyDemo.contains("Hello"), isFalse);
    expect(emptyDemo.contains("89%"), isFalse);
    expect(emptyDemo.contains("No tasks are in progress"), isFalse);

    final thinking = agentDayBriefing(
      thinkingTitle: "Bot Chat",
      doingCount: 2,
      todayCount: 3,
      paired: true,
      agentTitle: "Bot Chat",
    );
    expect(thinking.contains("Bot Chat is thinking right now."), isTrue);
    expect(thinking.contains("2 in progress, 3 due today."), isTrue);
  });

  test("hides empty Home list previews and idle chat placeholders", () {
    expect(showHomeListPreview(0), isFalse);
    expect(showHomeListPreview(1), isTrue);
    expect(
      chatHasHomePreview(const ChatListItem(id: "idle", title: "Bot Chat", queuedCount: 0, preview: "No messages yet")),
      isFalse,
    );
    expect(
      chatHasHomePreview(const ChatListItem(id: "live", title: "Bot Chat", queuedCount: 0, preview: "Need the host QR")),
      isTrue,
    );
  });
}
