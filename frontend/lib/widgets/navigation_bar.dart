import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';

class NavBar extends StatelessWidget {
  const NavBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: MainTheme.giRed,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Image.asset(
            'lib/assets/images/butterfly.png',
            height: 60,
          ),
          const Text(
            'Home',
            style: MainTheme.bodyText,
          ),
          const Text(
            'About us',
            style: MainTheme.bodyText,
          ),
          const Text(
            'Military',
            style: MainTheme.bodyText,
          ),
          const Text(
            'Space',
            style: MainTheme.bodyText,
          ),
          const Text(
            'Careers',
            style: MainTheme.bodyText,
          ),
          const Text(
            'Contact us',
            style: MainTheme.bodyText,
          ),
        ],
      ),
    );
  }
}
