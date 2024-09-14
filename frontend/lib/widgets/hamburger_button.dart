import 'package:flutter/material.dart';
import 'package:frontend/providers/navigation_provider.dart';
import 'package:provider/provider.dart';

class HamburgerButton extends StatelessWidget {
  const HamburgerButton({super.key});

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      icon: const Icon(
        Icons.menu,
        color: Colors.white,
      ),
      onSelected: (value) {},
      itemBuilder: (BuildContext context) {
        return [
          PopupMenuItem(
            onTap: () => {context.read<NavigationProvider>().updateIndex(0)},
            child: const ListTile(
              title: Text('Home'),
            ),
          ),
          PopupMenuItem(
            onTap: () => {context.read<NavigationProvider>().updateIndex(1)},
            child: const ListTile(
              title: Text('About Us'),
            ),
          ),
          PopupMenuItem(
            onTap: () => {context.read<NavigationProvider>().updateIndex(2)},
            child: const ListTile(
              title: Text('Mlitary'),
            ),
          ),
          PopupMenuItem(
            onTap: () => {context.read<NavigationProvider>().updateIndex(3)},
            child: const ListTile(
              title: Text('Space'),
            ),
          ),
          PopupMenuItem(
            onTap: () => {context.read<NavigationProvider>().updateIndex(4)},
            child: const ListTile(
              title: Text('Careers'),
            ),
          ),
          PopupMenuItem(
            onTap: () => {context.read<NavigationProvider>().updateIndex(5)},
            child: const ListTile(
              title: Text('Contact Us'),
            ),
          ),
        ];
      },
    );
  }
}
