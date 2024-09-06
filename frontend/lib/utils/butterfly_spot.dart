import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';

class ButterflySpot extends StatefulWidget {
  @override
  _ButterflySpotState createState() => _ButterflySpotState();
}

class _ButterflySpotState extends State<ButterflySpot> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
        onEnter: (_) {
          setState(() {
            _isHovered = true;
          });
        },
        onExit: (_) {
          setState(() {
            _isHovered = false;
          });
        },
        child: Stack(
          alignment:
              Alignment.center, // Ensure all children are centered in the stack
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 190),
              width: _isHovered ? 300 : 60,
              height: _isHovered ? 200 : 60,
              decoration: BoxDecoration(
                color: MainTheme.giRed,
                borderRadius: BorderRadius.circular(_isHovered ? 12 : 30),
              ),
            ),
            Center(
              child: Image.asset(
                'assets/images/white_butterfly.png',
                height: 40,
                width: 40,
              ),
            ),
          ],
        ) );
  }
}
