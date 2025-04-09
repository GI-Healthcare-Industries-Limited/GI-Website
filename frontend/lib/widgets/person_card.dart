import 'package:flutter/material.dart';
import 'package:frontend/utils/helpers.dart';

class PersonCard extends StatefulWidget {
  final String imagePath;
  final String name;
  final String jobRole;

  const PersonCard({
    super.key,
    required this.imagePath,
    required this.name,
    required this.jobRole,
  });

  @override
  _PersonCardState createState() => _PersonCardState();
}

class _PersonCardState extends State<PersonCard> {
  bool isHovered = false; // To track hover state

  @override
  Widget build(BuildContext context) {
    // Profile URL mapping
    String profilePath;
    switch (widget.name) {
      case 'Aswath GI':
        profilePath = 'https://www.linkedin.com/in/aswathgi/';
        break;
      case 'Adip Das':
        profilePath = 'https://www.linkedin.com/in/adip-das1998/';
        break;
      case 'Rafi Irvana':
        profilePath = 'https://www.linkedin.com/in/rafiirvana/';
        break;
      case 'Chris Mitchell':
        profilePath =
            'https://www.linkedin.com/in/christopher-mitchell-628458256/';
        break;
      case 'Jake Callcut':
        profilePath = 'https://www.linkedin.com/in/j-callcut/';
        break;
      case 'Bailey Tuddenham':
        profilePath = 'https://www.linkedin.com/in/baileytuddenham/';
        break;
      default:
        profilePath = '';
    }

    return Padding(
      padding: const EdgeInsets.all(16.0), // Adjust padding for spacing
      child: MouseRegion(
        onEnter: (_) => setState(() => isHovered = true),
        onExit: (_) => setState(() => isHovered = false),
        cursor: SystemMouseCursors.click,
        child: GestureDetector(
          onTap: () => Helpers.SendToUrl(profilePath),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
            transform: isHovered
                ? Matrix4.translationValues(0, -10, 0) // Lift the card
                : Matrix4.identity(),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: isHovered ? 20 : 10, // Increase shadow on hover
                  spreadRadius: isHovered ? 5 : 2,
                  offset: isHovered
                      ? const Offset(0, 5)
                      : const Offset(0, 1), // Slight shift in shadow
                ),
              ],
            ),
            child: SizedBox(
              width: 300, // Fixed width for the card
              height: 400, // Fixed height for the card
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Image.asset(widget.imagePath), // Image inside the card
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.name,
                              style: const TextStyle(fontSize: 20),
                            ),
                            Text(
                              widget.jobRole,
                              style: const TextStyle(
                                  color: Colors.grey, fontSize: 14),
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Image.asset('assets/images/link.webp'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
