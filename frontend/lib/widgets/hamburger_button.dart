import 'package:flutter/material.dart';
import 'package:frontend/providers/navigation_provider.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:provider/provider.dart';

class HamburgerButton extends StatelessWidget {
  const HamburgerButton({super.key, required this.isTransparent});
  final bool isTransparent;

  @override
  Widget build(BuildContext context) {
    Color bgColor = isTransparent ? Colors.black.withOpacity(0.6) : MainTheme.giRed;

    return PopupMenuButton<String>(
      icon: const Icon(
        Icons.menu,
        color: Colors.white,
      ),
      color: bgColor,
      shape: isTransparent
          ? RoundedRectangleBorder(
              side: BorderSide(
                color: Colors.white,
                width: 1,
              ),
              borderRadius: BorderRadius.circular(8),
            )
          : RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      onSelected: (value) {},
      itemBuilder: (BuildContext context) {
        return [
          PopupMenuItem(
            onTap: () => context.read<NavigationProvider>().updateIndex(0),
            child: const ListTile(
              title: Text(
                'Home',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),
          PopupMenuItem(
            onTap: () => context.read<NavigationProvider>().updateIndex(1),
            child: const ListTile(
              title: Text(
                'About Us',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),
          PopupMenuItem(
            onTap: () => context.read<NavigationProvider>().updateIndex(2),
            child: const ListTile(
              title: Text(
                'Military',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),
          PopupMenuItem(
            onTap: () => context.read<NavigationProvider>().updateIndex(3),
            child: const ListTile(
              title: Text(
                'Space',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),
          PopupMenuItem(
            onTap: () => context.read<NavigationProvider>().updateIndex(4),
            child: const ListTile(
              title: Text(
                'Careers',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),
          PopupMenuItem(
            onTap: () => context.read<NavigationProvider>().updateIndex(5),
            child: const ListTile(
              title: Text(
                'Contact Us',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),
        ];
      },
    );
  }
}
