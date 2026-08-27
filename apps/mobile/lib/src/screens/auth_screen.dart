import "package:flutter/material.dart";
import "package:managekar/src/state/session.dart";

const demoEmail = "demo@managekar.app";
const demoPassword = "Demo12345";

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.session, required this.onAuthed});

  final SessionController session;
  final VoidCallback onAuthed;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final email = TextEditingController();
  final password = TextEditingController();
  final name = TextEditingController(text: "User");
  bool register = false;

  @override
  void dispose() {
    email.dispose();
    password.dispose();
    name.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    final ok = register
        ? await widget.session.register(email.text.trim(), password.text, name.text.trim())
        : await widget.session.login(email.text.trim(), password.text);
    if (ok) {
      widget.onAuthed();
    }
  }

  Future<void> skipToDemo() async {
    email.text = demoEmail;
    password.text = demoPassword;
    var ok = await widget.session.login(demoEmail, demoPassword);
    if (!ok) {
      ok = await widget.session.register(demoEmail, demoPassword, "Demo");
    }
    if (ok) {
      widget.onAuthed();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.session,
      builder: (context, _) {
        return Scaffold(
          body: SafeArea(
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                const SizedBox(height: 32),
                Text("Manage.kar", style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 8),
                const Text("Tasks, notes, and habits on your account. Data lives in PostgreSQL."),
                const SizedBox(height: 28),
                if (register) ...[
                  _AuthField(
                    controller: name,
                    label: "Name",
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 12),
                ],
                _AuthField(
                  controller: email,
                  label: "Email",
                  autofocus: true,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 12),
                _AuthField(
                  controller: password,
                  label: "Password",
                  obscureText: true,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) {
                    if (!widget.session.busy) {
                      submit();
                    }
                  },
                ),
                if (widget.session.error != null) ...[
                  const SizedBox(height: 12),
                  Text(widget.session.error!, style: const TextStyle(color: Colors.red)),
                ],
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: widget.session.busy ? null : submit,
                  child: Text(register ? "Create account" : "Sign in"),
                ),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: widget.session.busy ? null : skipToDemo,
                  child: const Text("Skip to demo login"),
                ),
                TextButton(
                  onPressed: () => setState(() => register = !register),
                  child: Text(register ? "I already have an account" : "Create an account"),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _AuthField extends StatelessWidget {
  const _AuthField({
    required this.controller,
    required this.label,
    this.obscureText = false,
    this.autofocus = false,
    this.keyboardType,
    this.textInputAction,
    this.onSubmitted,
  });

  final TextEditingController controller;
  final String label;
  final bool obscureText;
  final bool autofocus;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      autofocus: autofocus,
      obscureText: obscureText,
      enableInteractiveSelection: true,
      autocorrect: false,
      enableSuggestions: false,
      smartDashesType: SmartDashesType.disabled,
      smartQuotesType: SmartQuotesType.disabled,
      keyboardType: keyboardType ?? (obscureText ? TextInputType.visiblePassword : TextInputType.text),
      textInputAction: textInputAction,
      onSubmitted: onSubmitted,
      contextMenuBuilder: (context, state) {
        return AdaptiveTextSelectionToolbar.editableText(editableTextState: state);
      },
      decoration: InputDecoration(labelText: label),
    );
  }
}
