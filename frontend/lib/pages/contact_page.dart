import 'package:flutter/material.dart';
import 'package:frontend/widgets/navigation_bar.dart';

class ContactPage extends StatelessWidget {
  const ContactPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Column(
          children: [
            const NavBar(isTransparent: false),
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1600), // Limit the content width
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    // Check if the width is more than 600px (typically a breakpoint for mobile/tablet)
                    if (constraints.maxWidth > 600) {
                      return const Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Enquiries Box on the left
                          Expanded(flex: 2, child: EnquiriesBox()),
                          // Spacer
                          SizedBox(width: 30),
                          // Get in Touch and Visit Us on the right
                          Expanded(flex: 3, child: GetInTouchBox()),
                        ],
                      );
                    } else {
                      // Stack the sections vertically for mobile
                      return const Column(
                        children: [
                          // Get in Touch and Visit Us on top
                          GetInTouchBox(),
                          // Spacer
                          SizedBox(height: 30),
                          // Enquiries Box on bottom
                          EnquiriesBox(),
                        ],
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
class EnquiriesBox extends StatelessWidget {
  const EnquiriesBox({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(color: Colors.red),
          borderRadius: BorderRadius.circular(10),
        ),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enquiries',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.red,
              ),
            ),
            const SizedBox(height: 20),
            const TextField(
              decoration: InputDecoration(
                labelText: 'Name',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            const TextField(
              decoration: InputDecoration(
                labelText: 'Email Address',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            const TextField(
              decoration: InputDecoration(
                labelText: 'Phone Number',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            const TextField(
              maxLines: 5,
              decoration: InputDecoration(
                labelText: 'Message',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                // Submit logic here
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
              ),
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }
}

// Get In Touch and Visit Us Widget
class GetInTouchBox extends StatelessWidget {
  const GetInTouchBox({super.key});

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
              color: Colors.red,
            ),
          ),
          const SizedBox(height: 20),
          ListTile(
            leading: Image.asset('assets/images/red_phone.png'),
            title: const Text('Give us a call'),
          ),
          ListTile(
            leading: Image.asset('assets/images/red_mail.png'),
            title: const Text('Send us an email'),
          ),
          ListTile(
            leading: Image.asset('assets/images/red_linkedin.png'),
            title: const Text('Find us on LinkedIn'),
          ),
          ListTile(
            leading: Image.asset('assets/images/red_x.png'),
            title: const Text('Follow us on X'),
          ),
          const SizedBox(height: 30),
          // Visit Us Section
          const Text(
            'Visit Us',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.red,
            ),
          ),
          const SizedBox(height: 20),
          ListTile(
            leading: Image.asset('assets/images/red_map_pin.png'),
            title: const Text(
              'The National Robotarium, Edinburgh, EH14 4AS',
              style: TextStyle(fontSize: 14),
            ),
          ),
          ListTile(
            leading: Image.asset('assets/images/red_map_pin.png'),
            title: const Text(
              '1F23 Student Ventures, Bristol, BS16 1QY',
              style: TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}
