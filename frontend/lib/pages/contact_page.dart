import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:frontend/utils/helpers.dart';
import 'package:frontend/widgets/navigation_bar.dart';
import 'package:http/http.dart' as http;

class ContactPage extends StatelessWidget {
  const ContactPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Column(
          children: [
            const NavBar(
              isTransparent: false,
              color: MainTheme.giRed,
            ),
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1600),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    if (constraints.maxWidth > 1030) {
                      return Padding(
                        padding: const EdgeInsets.only(top: 80),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(
                              width: 500,
                              child: EnquiriesBox(),
                            ),
                            const SizedBox(width: 30),
                            const SizedBox(
                              width: 500,
                              child: GetInTouchBox(),
                            ),
                          ],
                        ),
                      );
                    } else {
                      return Padding(
                        padding: const EdgeInsets.only(top: 20),
                        child: Column(
                          children: [
                            const GetInTouchBox(),
                            const SizedBox(height: 30),
                            EnquiriesBox(),
                          ],
                        ),
                      );
                    }
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Enquiries Box Widget
class EnquiriesBox extends StatefulWidget {
  const EnquiriesBox({super.key});

  @override
  State<EnquiriesBox> createState() => _EnquiriesBoxState();
}

class _EnquiriesBoxState extends State<EnquiriesBox> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _messageController = TextEditingController();
  bool _isSubmitting = false;
  bool _submissionSucceeded = false;
  String? _statusMessage;

  Future<void> _submitEnquiry() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final message = _messageController.text.trim();

    if (name.isEmpty || email.isEmpty || message.isEmpty) {
      setState(() {
        _submissionSucceeded = false;
        _statusMessage = 'Please enter your name, email address and message.';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _statusMessage = null;
    });

    try {
      final response = await http.post(
        Uri.parse('/api/contact'),
        headers: const {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'email': email,
          'phone': phone,
          'message': message,
        }),
      );

      if (!mounted) return;

      if (response.statusCode >= 200 && response.statusCode < 300) {
        _nameController.clear();
        _emailController.clear();
        _phoneController.clear();
        _messageController.clear();
        setState(() {
          _submissionSucceeded = true;
          _statusMessage = 'Thank you. Your message has been sent.';
        });
      } else {
        String errorMessage =
            'We could not send your message. Please try again.';
        try {
          final decoded = jsonDecode(response.body) as Map<String, dynamic>;
          if (decoded['error'] is String) {
            errorMessage = decoded['error'] as String;
          }
        } catch (_) {
          // Keep the safe fallback message when the server response is not JSON.
        }
        setState(() {
          _submissionSucceeded = false;
          _statusMessage = errorMessage;
        });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _submissionSucceeded = false;
        _statusMessage =
            'We could not send your message. Please check your connection and try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Container(
        decoration: MainTheme.tileDecoration,
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enquiries',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: MainTheme.giRed,
              ),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _nameController,
              autofillHints: const [AutofillHints.name],
              decoration: const InputDecoration(
                labelText: 'Name',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              decoration: const InputDecoration(
                labelText: 'Email Address',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              autofillHints: const [AutofillHints.telephoneNumber],
              decoration: const InputDecoration(
                labelText: 'Phone Number',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _messageController,
              maxLines: 5,
              decoration: InputDecoration(
                labelText: 'Message',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitEnquiry,
              style: ButtonStyle(
                backgroundColor: WidgetStateProperty.resolveWith<Color>(
                  (Set<WidgetState> states) {
                    if (states.contains(WidgetState.hovered)) {
                      return Colors.white;
                    }
                    return MainTheme.giRed;
                  },
                ),
                foregroundColor: WidgetStateProperty.resolveWith<Color>(
                  (Set<WidgetState> states) {
                    if (states.contains(WidgetState.hovered)) {
                      return MainTheme.giRed;
                    }
                    return Colors.white;
                  },
                ),
                side: WidgetStateProperty.resolveWith<BorderSide>(
                  (Set<WidgetState> states) {
                    if (states.contains(WidgetState.hovered)) {
                      return const BorderSide(color: MainTheme.giRed);
                    }
                    return BorderSide.none;
                  },
                ),
              ),
              child: Text(_isSubmitting ? 'Sending…' : 'Submit'),
            ),
            if (_statusMessage != null) ...[
              const SizedBox(height: 12),
              Semantics(
                liveRegion: true,
                child: Text(
                  _statusMessage!,
                  style: TextStyle(
                    color: _submissionSucceeded
                        ? Colors.green[700]
                        : MainTheme.giRed,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class GetInTouchBox extends StatefulWidget {
  const GetInTouchBox({super.key});

  @override
  State<GetInTouchBox> createState() => _GetInTouchBoxState();
}

class _GetInTouchBoxState extends State<GetInTouchBox> {
  @override
  void dispose() {
    // Add any controller or resource disposal here if needed in the future
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Get in Touch Section
          const Text(
            'Get in Touch',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: MainTheme.giRed,
            ),
          ),
          const SizedBox(height: 20),
          InkWell(
            onTap: () => Helpers.SendToUrl('tel:+441313928881'),
            child: ListTile(
              leading: Image.asset(
                'assets/images/red_phone.webp',
                height: 30,
              ),
              title: const Text('+44 131 392 8881'),
            ),
          ),
          InkWell(
            onTap: () =>
                Helpers.SendToUrl('mailto:enquiries@gihealthcare.co.uk'),
            child: ListTile(
              leading: Image.asset(
                'assets/images/red_mail.webp',
                height: 30,
              ),
              title: const Text('Send us an email'),
            ),
          ),
          InkWell(
            onTap: () =>
                Helpers.SendToUrl('https://www.linkedin.com/company/gihil/'),
            child: ListTile(
              leading: Image.asset(
                'assets/images/red_linkedin.webp',
                height: 30,
              ),
              title: const Text('Find us on LinkedIn'),
            ),
          ),
          InkWell(
            onTap: () => Helpers.SendToUrl(
                'https://www.crunchbase.com/organization/gi-healthcare-industries'),
            child: ListTile(
              leading: Padding(
                padding: const EdgeInsets.only(left: 2),
                child: Image.asset(
                  'assets/images/cb.webp',
                  height: 25,
                ),
              ),
              title: const Text('Find us on Crunchbase'),
            ),
          ),
          const SizedBox(height: 30),
          // Visit Us Section
          const Text(
            'Visit Us',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: MainTheme.giRed,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Visit our HQ',
            style: TextStyle(color: Colors.grey),
          ),
          InkWell(
            onTap: () =>
                Helpers.SendToUrl('https://maps.app.goo.gl/7Xtk2bhCXDban21n7'),
            child: ListTile(
              leading: Image.asset(
                'assets/images/red_map_pin.webp',
                height: 30,
              ),
              title: const Text(
                '1F23 Student Ventures, Bristol, BS16 1QY',
                style: TextStyle(fontSize: 14),
              ),
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Visit our R&D Lab',
            style: TextStyle(color: Colors.grey),
          ),
          InkWell(
            onTap: () =>
                Helpers.SendToUrl('https://maps.app.goo.gl/7Xtk2bhCXDban21n7'),
            child: ListTile(
              leading: Image.asset(
                'assets/images/red_map_pin.webp',
                height: 30,
              ),
              title: const Text(
                'The National Robotarium, Edinburgh, EH14 4AS',
                style: TextStyle(fontSize: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
