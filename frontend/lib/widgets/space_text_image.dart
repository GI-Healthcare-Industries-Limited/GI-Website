import 'package:flutter/material.dart';

class SpaceTextImage extends StatelessWidget {
  final String imagePath;
  final String text;
  final bool imageFirst;

  SpaceTextImage({required this.imagePath, required this.text, required this.imageFirst});
  @override
  Widget build(BuildContext context) {
    return imageFirst 
    ? Padding(
      padding: const EdgeInsets.symmetric(vertical: 24.0, horizontal: 16.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            color: Colors.grey,
            child: Image.asset(imagePath, fit: BoxFit.cover),
          ),
          SizedBox(width: 16),
          Container(
            width: 600,
            padding: EdgeInsets.all(16),
            child: Text(
              text,
              style: TextStyle(
                fontSize: 16,
                color: Colors.white,
              ),
              textAlign: TextAlign.justify,
            ),
          ),
        ],
      ),
    )
    : Padding(
      padding: const EdgeInsets.symmetric(vertical: 24.0, horizontal: 16.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          
          SizedBox(width: 16),
          Container(
            width: 600,
            padding: EdgeInsets.all(16),
            child: Text(
              text,
              style: TextStyle(
                fontSize: 16,
                color: Colors.white,
              ),
              textAlign: TextAlign.justify,
            ),
          ),
          Container(
            color: Colors.grey,
            child: Image.asset(imagePath, fit: BoxFit.cover),
          ),
        ],
      ),
    );
  }
}
