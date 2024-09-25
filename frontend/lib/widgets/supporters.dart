import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:frontend/widgets/linked_image.dart';

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

              // LinkedImage(url: 'https://www.gov.uk/government/organisations/ministry-of-defence', imagePath: 'assets/images/mod.webp'),
              // LinkedImage(url: 'https://www.gov.uk/government/organisations/uk-space-agency', imagePath: 'assets/images/uksa.webp'),
              // LinkedImage(url: 'https://www.ukri.org/councils/innovate-uk/', imagePath: 'assets/images/innovate_uk.webp'),
              // LinkedImage(url: 'https://labs.uk.barclays/', imagePath: 'assets/images/eagle_labs.webp'),
              // LinkedImage(url: 'https://www.uwe.ac.uk/', imagePath: 'assets/images/uwe.webp'),
              // LinkedImage(url: 'https://www.hw.ac.uk/', imagePath: 'assets/images/hwu.webp'),
              // LinkedImage(url: 'https://www.bristol.ac.uk/', imagePath: 'assets/images/uob.webp'),
              // LinkedImage(url: 'https://www.santander.co.uk/', imagePath: 'assets/images/santander.webp'),
              // LinkedImage(url: 'https://thenationalrobotarium.com/', imagePath: 'assets/images/nr.webp'),

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
