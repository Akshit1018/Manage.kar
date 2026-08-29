import "package:flutter/material.dart";
import "package:managekar/src/state/dialer.dart";

Color presenceColor(String presence, [String? source]) {
  if (source == "demo") {
    return const Color(0xFF9CA3AF);
  }
  switch (presence) {
    case "active":
      return const Color(0xFF10B981);
    case "idle":
      return const Color(0xFFFACC15);
    default:
      return const Color(0xFFEF4444);
  }
}

String presenceLabel(String presence, [String? source]) {
  if (source == "demo") {
    return "not paired";
  }
  switch (presence) {
    case "active":
      return "reachable";
    case "idle":
      return "asleep";
    default:
      return "unreachable";
  }
}

class ChatsTab extends StatelessWidget {
  const ChatsTab({super.key, required this.dialer});

  final DialerController dialer;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: dialer,
      builder: (context, _) {
        final items = chatListItems(dialer.state);
        return SafeArea(
          child: Scaffold(
            appBar: AppBar(title: const Text("Chats")),
            floatingActionButton: FloatingActionButton.extended(
              heroTag: "new-chat",
              onPressed: () => openChatThread(context, dialer, newChatTarget),
              icon: const Icon(Icons.add),
              label: const Text("New chat"),
            ),
            body: ListView.builder(
              padding: const EdgeInsets.only(bottom: 96),
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
                    child: Icon(
                      item.id == newChatTarget ? Icons.add : Icons.chat_bubble_outline,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  title: Row(
                    children: [
                      if (item.presence != null) ...[
                        Semantics(
                          label: presenceLabel(item.presence!, item.source),
                          child: Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: presenceColor(item.presence!, item.source),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                      ],
                      Flexible(child: Text(item.title, overflow: TextOverflow.ellipsis)),
                      if (item.presence != null) ...[
                        const SizedBox(width: 6),
                        Text(
                          presenceLabel(item.presence!, item.source),
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                      ],
                      if (item.source == "demo") ...[
                        const SizedBox(width: 6),
                        const _Badge(text: "Demo"),
                      ],
                      if (item.queuedCount > 0) ...[
                        const SizedBox(width: 6),
                        _Badge(text: "${item.queuedCount} queued", tone: _BadgeTone.queued),
                      ],
                    ],
                  ),
                  subtitle: Text(item.preview, maxLines: 2, overflow: TextOverflow.ellipsis),
                  onTap: () => openChatThread(context, dialer, item.id),
                );
              },
            ),
          ),
        );
      },
    );
  }
}

Future<void> openChatThread(BuildContext context, DialerController dialer, String target) {
  return Navigator.push(
    context,
    MaterialPageRoute<void>(builder: (_) => ChatThreadScreen(dialer: dialer, target: target)),
  );
}

class ChatThreadScreen extends StatefulWidget {
  const ChatThreadScreen({super.key, required this.dialer, required this.target});

  final DialerController dialer;
  final String target;

  @override
  State<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends State<ChatThreadScreen> {
  final TextEditingController input = TextEditingController();

  @override
  void dispose() {
    input.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final message = await widget.dialer.send(widget.target, input.text);
    if (message == null || !mounted) {
      return;
    }
    input.clear();
    final session = resolveSession(widget.dialer.state, widget.target);
    final copy = queueCopy(
      status: message.status,
      source: session?.source,
      presence: session?.presence,
    );
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(copy)));
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.dialer,
      builder: (context, _) {
        final state = widget.dialer.state;
        final session = resolveSession(state, widget.target);
        final title = targetTitle(visibleSessions(state), widget.target);
        final messages = messagesForTarget(state, widget.target);
        final scheme = Theme.of(context).colorScheme;
        return Scaffold(
          appBar: AppBar(
            title: Row(
              children: [
                if (session != null) ...[
                  Semantics(
                    label: presenceLabel(session.presence, session.source),
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: presenceColor(session.presence, session.source),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                Flexible(child: Text(title, overflow: TextOverflow.ellipsis)),
                if (session != null) ...[
                  const SizedBox(width: 8),
                  Text(
                    presenceLabel(session.presence, session.source),
                    style: Theme.of(context).textTheme.labelSmall,
                  ),
                ],
                if (session?.source == "demo") ...[
                  const SizedBox(width: 8),
                  const _Badge(text: "Demo"),
                ],
              ],
            ),
          ),
          body: Column(
            children: [
              Expanded(
                child: messages.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Text(
                            "Messages stay on this phone until this machine is paired with Hermes.",
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ),
                      )
                    : ListView.builder(
                        reverse: true,
                        padding: const EdgeInsets.all(16),
                        itemCount: messages.length,
                        itemBuilder: (context, index) {
                          final message = messages[messages.length - 1 - index];
                          final copy = queueCopy(
                            status: message.status,
                            source: session?.source,
                            presence: session?.presence,
                          );
                          return Align(
                            alignment: Alignment.centerRight,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 10, left: 48),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: scheme.primary,
                                borderRadius: const BorderRadius.only(
                                  topLeft: Radius.circular(16),
                                  topRight: Radius.circular(16),
                                  bottomLeft: Radius.circular(16),
                                  bottomRight: Radius.circular(4),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(message.text, style: TextStyle(color: scheme.onPrimary)),
                                  const SizedBox(height: 4),
                                  Text(
                                    copy,
                                    style: TextStyle(
                                      color: scheme.onPrimary.withValues(alpha: 0.8),
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: input,
                          textInputAction: TextInputAction.send,
                          onSubmitted: (_) => _send(),
                          decoration: const InputDecoration(
                            hintText: "Message…",
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.all(Radius.circular(24)),
                            ),
                            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        tooltip: "Send message",
                        onPressed: _send,
                        icon: const Icon(Icons.send),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

enum _BadgeTone { neutral, queued }

class _Badge extends StatelessWidget {
  const _Badge({required this.text, this.tone = _BadgeTone.neutral});

  final String text;
  final _BadgeTone tone;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final Color background;
    final Color foreground;
    switch (tone) {
      case _BadgeTone.neutral:
        background = scheme.secondaryContainer;
        foreground = scheme.onSecondaryContainer;
      case _BadgeTone.queued:
        background = const Color(0xFFFACC15).withValues(alpha: 0.25);
        foreground = const Color(0xFF854D0E);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(999)),
      child: Text(text, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: foreground)),
    );
  }
}
