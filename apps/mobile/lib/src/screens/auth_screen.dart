import "package:flutter/material.dart";
import "package:managekar/src/state/session.dart";

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
                  TextField(
                    controller: name,
                    decoration: const InputDecoration(labelText: "Name"),
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 12),
                ],
                TextField(
                  controller: email,
                  decoration: const InputDecoration(labelText: "Email"),
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: password,
                  decoration: const InputDecoration(labelText: "Password"),
                  obscureText: true,
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
