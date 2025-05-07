import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:vector_math/vector_math_64.dart' as vm;

class ButterflySpot extends StatefulWidget {
  final String title;
  final String text;

  const ButterflySpot({super.key, required this.title, required this.text});

  @override
  _ButterflySpotState createState() => _ButterflySpotState();
}

class _ButterflySpotState extends State<ButterflySpot> {
  bool _isHovered = false;
  double _shiftX = 0;
  double _shiftY = 0;

  @override
  Widget build(BuildContext context) {

    // The spot itself
    Widget spot = MouseRegion(
      onEnter: (_) {
        setState(() {
          _isHovered = true;
        });
        WidgetsBinding.instance.addPostFrameCallback((_) {
          final ro = context.findRenderObject();
          if (ro is RenderBox) {
            final position = ro.localToGlobal(Offset.zero);
            final screenWidth = MediaQuery.of(context).size.width;
            final screenHeight = MediaQuery.of(context).size.height;
            const expandedWidth = 360.0;
            const expandedHeight = 200.0;
            double newShiftX = 0, newShiftY = 0;
            // Horizontal overflow
            final overflowX = position.dx + expandedWidth - screenWidth;
            if (overflowX > 0) {
              newShiftX = -overflowX;
            } else if (position.dx < 0) {
              newShiftX = -position.dx;
            }
            // Vertical overflow
            final overflowY = position.dy + expandedHeight - screenHeight;
            if (overflowY > 0) {
              newShiftY = -overflowY;
            } else if (position.dy < 0) {
              newShiftY = -position.dy;
            }
            setState(() {
              _shiftX = newShiftX;
              _shiftY = newShiftY;
            });
          }
        });
      },
      onExit: (_) {
        setState(() {
          _isHovered = false;
          _shiftX = 0;
          _shiftY = 0;
        });
      },
      child: Stack(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            width: _isHovered ? 360 : 60,
            height: _isHovered ? 200 : 60,
            alignment: Alignment.center,
            clipBehavior: Clip.hardEdge,
            decoration: BoxDecoration(
              color: MainTheme.giRed,
              borderRadius: BorderRadius.circular(_isHovered ? 12 : 30),
              border: Border.all(color: Colors.white, width: 2),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  spreadRadius: 2,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
            child: _isHovered
                ? Padding(
                    padding: const EdgeInsets.fromLTRB(30, 0, 30, 0),
                    child: SingleChildScrollView(
                      child: Column(
                        mainAxisSize: MainAxisSize.max,
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text(
                            widget.title,
                            textAlign: TextAlign.center,
                            style: MainTheme.headerText,
                            softWrap: true,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            widget.text,
                            textAlign: TextAlign.center,
                            style: MainTheme.bodyText,
                            softWrap: true,
                          ),
                        ],
                      ),
                    ),
                  )
                : const SizedBox.shrink(),
          ),
          Positioned(
            top: 10,
            left: 10,
            child: Image.asset(
              'assets/images/white_butterfly.webp',
              height: 40,
              width: 40,
            ),
          ),
        ],
      ),
    );

    // Wrap in AnimatedContainer with matrix transform to shift it left if needed
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
      transform: vm.Matrix4.translationValues(_shiftX, _shiftY, 0),
      child: spot,
    );
  }
}