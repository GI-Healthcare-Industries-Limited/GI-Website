import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:frontend/providers/navigation_provider.dart';
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
          InkWell(
            onTap: () {
              context.read<NavigationProvider>().updateIndex(0);
            },
            child: const Text(
              'Home',
              style: MainTheme.bodyText,
            ),
          ),
          InkWell(
            onTap: () {
              context.read<NavigationProvider>().updateIndex(1);
            },
            child: const Text(
              'About us',
              style: MainTheme.bodyText,
            ),
          ),
          InkWell(
            onTap: () {
              context.read<NavigationProvider>().updateIndex(2);
            },
            child: const Text(
              'Military',
              style: MainTheme.bodyText,
            ),
          ),
          InkWell(
            onTap: () {
              context.read<NavigationProvider>().updateIndex(3);
            },
            child: const Text(
              'Space',
              style: MainTheme.bodyText,
            ),
          ),
          InkWell(
            onTap: () {
              context.read<NavigationProvider>().updateIndex(4);
            },
            child: const Text(
              'Careers',
              style: MainTheme.bodyText,
            ),
          ),
          InkWell(
            onTap: () {
              context.read<NavigationProvider>().updateIndex(5);
            },
            child: const Text(
              'Contact us',
              style: MainTheme.bodyText,
            ),
          ),
        ],
      ),
    );
  }
}
