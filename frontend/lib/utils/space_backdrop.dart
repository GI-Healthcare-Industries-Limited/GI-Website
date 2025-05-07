import 'dart:ui';
import 'package:flutter/material.dart';

class SpaceBackdrop extends StatelessWidget {
  final double scrollOffset;
  final double blurSigmaX;
  final double blurSigmaY;

  SpaceBackdrop({
    required this.scrollOffset,
    this.blurSigmaX = 5.0,
    this.blurSigmaY = 5.0,
  });

  @override
  Widget build(BuildContext context) {
    return ImageFiltered(
      imageFilter: ImageFilter.blur(sigmaX: blurSigmaX, sigmaY: blurSigmaY),
      child: Container(
        height: MediaQuery.of(context).size.height + 2000,
        child: Stack(
          children: [
            Positioned(
              top: 165 - scrollOffset * 0.1,
              left: 0,
              child: Image.asset(
                "assets/images/earth.webp",
                height: 400,
              ),
            ),
            Positioned(
              top: 223 - scrollOffset * 0.4,
              right: 0,
              child: Image.asset(
                "assets/images/mars.webp",
                height: 300,
              ),
            ),
            Positioned(
              top: 600 - scrollOffset * 0.3, 
              right: 0,
              child: Image.asset(
                "assets/images/moon.webp",
                height: 300,
              ),
            ),
            Positioned(
              top: 900 - scrollOffset * 0.2,
              left: 0,
              child: Image.asset(
                "assets/images/neptune.webp",
                height: 500,
              ),
            ),
            Positioned(
              top: 1000 - scrollOffset * 0.2,
              right: 0,
              child: Image.asset(
                "assets/images/mercury.webp",
                height: 500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}