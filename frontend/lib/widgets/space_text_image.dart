import 'dart:ui';
import 'package:flutter/material.dart';

class SpaceTextImage extends StatelessWidget {
  final String imagePath;
  final String text;
  final bool imageFirst;

  SpaceTextImage({
    required this.imagePath,
    required this.text,
    required this.imageFirst,
  });

  Widget _buildImage() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Image.asset(imagePath, fit: BoxFit.cover),
    );
  }

  Widget _buildTextContainer(bool isLeftBorderRadius, {double? width}) {
    BorderRadius borderRadius = isLeftBorderRadius
        ? const BorderRadius.only(
            topLeft: Radius.circular(12),
            bottomLeft: Radius.circular(12),
          )
        : const BorderRadius.only(
            topRight: Radius.circular(12),
            bottomRight: Radius.circular(12),
          );
    Border border = isLeftBorderRadius
        ? const Border(
            top: BorderSide(color: Colors.white),
            left: BorderSide(color: Colors.white),
            bottom: BorderSide(color: Colors.white),
          )
        : const Border(
            top: BorderSide(color: Colors.white),
            right: BorderSide(color: Colors.white),
            bottom: BorderSide(color: Colors.white),
          );
    return ClipRRect(
      borderRadius: borderRadius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
        child: Container(
          width: width ?? 600,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.2),
            borderRadius: borderRadius,
            border: border,
          ),
          child: Padding(
            padding: const EdgeInsets.all(60),
            child: Text(
              text,
              style: const TextStyle(fontSize: 16, color: Colors.white),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Vertical layout if available width is less than 1200.
        bool isSmall = constraints.maxWidth < 1200;

        if (isSmall) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 24.0, horizontal: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: imageFirst
                  ? [
                      _buildImage(),
                      const SizedBox(height: 20),
                      // Full width container for vertical layout with extra horizontal padding.
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32.0),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
                            child: Container(
                              width: double.infinity,
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.white),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(20),
                                child: Text(
                                  text,
                                  style: const TextStyle(fontSize: 16, color: Colors.white),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ]
                  : [
                      // Text above image with horizontal padding.
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32.0),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
                            child: Container(
                              width: double.infinity,
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.white),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(20),
                                child: Text(
                                  text,
                                  style: const TextStyle(fontSize: 16, color: Colors.white),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      _buildImage(),
                    ],
            ),
          );
        } else {
          // Horizontal layout for larger screens:
          // Compute dynamic widths based on the available space.
          double imageWidth = constraints.maxWidth * 0.35; // Image takes 35% of width.
          double textContainerWidth = constraints.maxWidth * 0.5; // Text takes 50% of width.
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 24.0, horizontal: 16.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: imageFirst
                  ? [
                      Container(
                        width: imageWidth,
                        child: _buildImage(),
                      ),
                      _buildTextContainer(false, width: textContainerWidth),
                    ]
                  : [
                      _buildTextContainer(true, width: textContainerWidth),
                      //const SizedBox(width: 20),
                      Container(
                        width: imageWidth,
                        child: _buildImage(),
                      ),
                    ],
            ),
          );
        }
      },
    );
  }
}
