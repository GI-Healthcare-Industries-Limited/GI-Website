import 'package:flutter/material.dart';

class SpaceTextImage extends StatelessWidget {
  final String text;
  final String imagePath;
  final bool imageFirst;

  const SpaceTextImage({
    Key? key,
    required this.text,
    required this.imagePath,
    required this.imageFirst,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    double screenWidth = MediaQuery.of(context).size.width;

    return imageFirst
        ? Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(children: [
              Image.asset(imagePath),
              Container(
                  child: Text(
                text,
                softWrap: true,
                maxLines: null,
                overflow: TextOverflow.visible,
              )),
            ]),
          )
        : Row(
            children: [],
          );
  }
}
