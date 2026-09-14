import 'package:flutter/material.dart';
import 'package:frontend/utils/helpers.dart';

// Fallback for an old in-app contact navigation state. All current navigation
// opens the native same-domain page directly through NavigationProvider.
class ContactPage extends StatelessWidget {
  const ContactPage({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        body: Center(
          child: TextButton(
            onPressed: () => Helpers.SendToSameTab('/contact'),
            child: const Text('Open contact form'),
          ),
        ),
      );
}
