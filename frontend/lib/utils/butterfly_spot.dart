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
              duration: const Duration(milliseconds: 180),
              width: _isHovered ? 360 : 60,
              height: _isHovered ? 200 : 60,
              decoration: BoxDecoration(
                  color: MainTheme.giRed,
                  borderRadius: BorderRadius.circular(_isHovered ? 12 : 30),
                  border: Border.all(
                    color: Colors.white,
                    width: 2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 10,
                      spreadRadius: 2,
                      offset: const Offset(0, 1),
                    )
                  ]),
              child: _isHovered
                  ? Padding(
                    padding: const EdgeInsets.fromLTRB(30, 0, 30, 0),
                    child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text(
                            textAlign: TextAlign.center,
                            widget.title,
                            style: MainTheme.headerText,
                          ),
                          Text(
                            textAlign: TextAlign.center,
                            widget.text,
                            style: MainTheme.bodyText,
                          ),
                        ],
                      ),
                  )
                  : Container(),
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
          ],
        ));
  }
}
