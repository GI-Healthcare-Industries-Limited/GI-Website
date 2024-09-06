import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:frontend/providers/navigation_provider.dart';
import 'package:frontend/themes/main_theme.dart';

class NavBar extends StatelessWidget {
  final bool isTransparent;

  const NavBar({super.key, required this.isTransparent});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 700),
      decoration: BoxDecoration(
        color: isTransparent ? Colors.transparent : MainTheme.giRed,
        border: const Border(bottom: BorderSide(color: Colors.white)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Image.asset(
              'assets/images/white_butterfly.png',
              height: 50,
            ),
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
