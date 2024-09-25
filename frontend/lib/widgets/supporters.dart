import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';

class Supporters extends StatelessWidget {
  const Supporters({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final double imageSize;
    screenWidth < 800 ? imageSize = 130 : imageSize = 200;

    return Padding(
      padding: EdgeInsets.fromLTRB(screenWidth / 8, 100, screenWidth / 8, 80),
      child: Column(
        children: [
          const Text(
            'Our Supporters',
            style: MainTheme.problemText,
          ),
          const SizedBox(
            height: 40,
          ),
          Wrap(
            spacing: 20.0,
            runSpacing: 20,
            alignment: WrapAlignment.center,
            children: [
              Image.asset('assets/images/mod.webp', width: imageSize),
              Image.asset('assets/images/uksa.webp', width: imageSize),
              Image.asset('assets/images/innovate_uk.webp', width: imageSize),
              Image.asset('assets/images/eagle_labs.webp', width: imageSize),
              Image.asset('assets/images/uwe.webp', width: imageSize),
              Image.asset('assets/images/hwu.webp', width: imageSize),
              Image.asset('assets/images/uob.webp', width: imageSize),
              Image.asset('assets/images/santander.webp', width: imageSize),
              Image.asset('assets/images/nr.webp', width: imageSize),
            ],
          ),
        ],
      ),
    );
  }
}
