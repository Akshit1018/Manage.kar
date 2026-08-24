import "package:flutter/material.dart";
import "package:managekar/src/state/workspace.dart";

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, required this.workspace});

  final WorkspaceController workspace;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final name = TextEditingController(text: widget.workspace.user?["name"] as String? ?? "");
  late final phone = TextEditingController(text: widget.workspace.user?["phone"] as String? ?? "");
  late final location = TextEditingController(text: widget.workspace.user?["location"] as String? ?? "");
  late final bio = TextEditingController(text: widget.workspace.user?["bio"] as String? ?? "");

  @override
  void dispose() {
    name.dispose();
    phone.dispose();
    location.dispose();
    bio.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Profile")),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          ListTile(contentPadding: EdgeInsets.zero, title: const Text("Email"), subtitle: Text(widget.workspace.user?["email"] as String? ?? "")),
          TextField(controller: name, decoration: const InputDecoration(labelText: "Name")),
          const SizedBox(height: 12),
          TextField(controller: phone, decoration: const InputDecoration(labelText: "Phone")),
          const SizedBox(height: 12),
          TextField(controller: location, decoration: const InputDecoration(labelText: "Location")),
          const SizedBox(height: 12),
          TextField(controller: bio, decoration: const InputDecoration(labelText: "Bio"), maxLines: 3),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () async {
              await widget.workspace.saveProfile({
                "name": name.text.trim(),
                "phone": phone.text.trim(),
                "location": location.text.trim(),
                "bio": bio.text.trim(),
              });
              if (context.mounted) {
                Navigator.pop(context);
              }
            },
            child: const Text("Save"),
          ),
        ],
      ),
    );
  }
}
