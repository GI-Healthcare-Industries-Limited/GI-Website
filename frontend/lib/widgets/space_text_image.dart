import 'dart:ui';

import 'package:flutter/material.dart';

class SpaceTextImage extends StatelessWidget {
  final String imagePath;
  final String text;
  final bool imageFirst;

  SpaceTextImage(
      {required this.imagePath, required this.text, required this.imageFirst});
  @override
  Widget build(BuildContext context) {
    return imageFirst

        //image appearing before text
        ? Padding(
            padding:
                const EdgeInsets.symmetric(vertical: 24.0, horizontal: 16.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Image.asset(imagePath, fit: BoxFit.cover),
                ),
                ClipRRect(
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
                    child: Container(
                      width: 600,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.only(
                            topRight: Radius.circular(12),
                            bottomRight: Radius.circular(12)),
                        border: Border(
                          top: BorderSide(color: Colors.white),
                          right: BorderSide(color: Colors.white),
                          bottom: BorderSide(color: Colors.white),
                        ),
                      ),
                      child: Padding(
                        padding: EdgeInsets.all(60),
                        child: Text(
                          text,
                          style: TextStyle(fontSize: 16, color: Colors.white),
                        ),
                      ),
                    ),
                  ),
                )
              ],
            ),
          )

        //image appearing after text
        : Padding(
            padding:
                const EdgeInsets.symmetric(vertical: 24.0, horizontal: 16.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ClipRRect(
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
                    child: Container(
                      width: 600,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(12),
                            bottomLeft: Radius.circular(12)),
                        border: Border(
                          top: BorderSide(color: Colors.white),
                          left: BorderSide(color: Colors.white),
                          bottom: BorderSide(color: Colors.white),
                        ),
                      ),
                      child: Padding(
                        padding: EdgeInsets.all(60),
                        child: Text(
                          text,
                          style: TextStyle(fontSize: 16, color: Colors.white),
                        ),
                      ),
                    ),
                  ),
                ),
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Image.asset(imagePath, fit: BoxFit.cover),
                ),
              ],
            ),
          );
  }
}
