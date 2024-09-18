import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:frontend/utils/helpers.dart';
import 'package:frontend/widgets/navigation_bar.dart';

class ContactPage extends StatelessWidget {
  const ContactPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Column(
          children: [
            const NavBar(isTransparent: false),
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1600),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    if (constraints.maxWidth > 1030) {
                      return const Padding(
                        padding: EdgeInsets.only(top: 80),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(
                              width: 500,
                              child: EnquiriesBox(),
                            ),
                            SizedBox(width: 30),
                            SizedBox(
                              width: 500,
                              child: GetInTouchBox(),
                            ),
                          ],
                        ),
                      );
                    } else {
                      return const Padding(
                        padding: EdgeInsets.only(top: 20),
                        child: Column(
                          children: [
                            GetInTouchBox(),
                            SizedBox(height: 30),
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
class EnquiriesBox extends StatelessWidget {
  const EnquiriesBox({super.key});

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
              color: MainTheme.giRed,
            ),
          ),
          const SizedBox(height: 20),
          InkWell(
            onTap: () => Helpers.SendToUrl('tel:+441313928881'),
            child: ListTile(
              leading: Image.asset(
                'assets/images/red_phone.png',
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
                'assets/images/red_mail.png',
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
                'assets/images/red_linkedin.png',
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
                  'assets/images/cb.png',
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
                'assets/images/red_map_pin.png',
                height: 30,
              ),
              title: const Text(
                '1F23 Student Ventures, Bristol, BS16 1QY',
                style: TextStyle(fontSize: 14),
              ),
            ),
          ),
          const SizedBox(
            height: 10,
          ),
          const Text(
            'Visit our R&D Lab',
            style: TextStyle(color: Colors.grey),
          ),
          InkWell(
            onTap: () =>
                Helpers.SendToUrl('https://maps.app.goo.gl/7Xtk2bhCXDban21n7'),
            child: ListTile(
              leading: Image.asset(
                'assets/images/red_map_pin.png',
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
