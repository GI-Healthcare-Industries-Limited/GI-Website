import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';

class ButterflySpot extends StatefulWidget {
  final String title;
  final String text;

  const ButterflySpot({super.key, required this.title, required this.text});

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
            Positioned(
              top: 10,
              left: 10,
              child: Image.asset(
                'assets/images/white_butterfly.png',
                height: 40,
                width: 40,
              ),
            ),
            _isHovered ? Column(
              children: [
                Text(widget.title, style: MainTheme.headerText,),
                Text(widget.text, style: MainTheme.smallPrint,),
              ],
            ) : Container(),
          ],
        ) );
  }
}
