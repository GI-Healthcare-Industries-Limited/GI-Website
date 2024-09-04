import 'package:flutter/material.dart';
import 'package:frontend/utils/helpers.dart';

class LinkedImage extends StatefulWidget {
  const LinkedImage({super.key, required this.url, required this.imagePath});

  final String url;
  final String imagePath;

  @override
  _LinkedImageState createState() => _LinkedImageState();
}

class _LinkedImageState extends State<LinkedImage> {
  // Variable to control hover effect
  bool _isHovering = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) {
        setState(() {
          _isHovering = true;
        });
      },
      onExit: (_) {
        setState(() {
          _isHovering = false;
        });
      },
      child: Container(
        height: 180,  // Define the height here based on your needs
        width: 260,   // Define the width if necessary
        decoration: BoxDecoration(
            boxShadow: [
              if (_isHovering)
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 8,
                ),
            ],
          ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // Positioned widget to control the hover-out effect
            AnimatedPositioned(
              duration: const Duration(milliseconds: 100),
              top: _isHovering ? -5 : 0, // Move up when hovering
              left: 0,
              child: GestureDetector(
                onTap: () => Helpers.SendToUrl(widget.url),
                child: Image.asset(
                  widget.imagePath,
                  height: 180,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
