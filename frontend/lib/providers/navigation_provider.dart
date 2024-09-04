import 'package:flutter/material.dart';
import 'package:frontend/pages/about_page.dart';
import 'package:frontend/pages/careers_page.dart';
import 'package:frontend/pages/contact_page.dart';
import 'package:frontend/pages/home_page.dart';
import 'package:frontend/pages/military_page.dart';
import 'package:frontend/pages/space_page.dart';

class NavigationProvider with ChangeNotifier {
  int _currentIndex = 0;

  // This list can be customized based on your app's pages
  final List<Widget> _pages = [
    HomePage(),
    AboutPage(),
    MilitaryPage(),
    SpacePage(),
    CareersPage(),
    ContactPage(),
  ];

  // Get the current index
  int get currentIndex => _currentIndex;

  // Get the current page
  Widget get currentPage => _pages[_currentIndex];

  // Function to update the current index and notify listeners
  void updateIndex(int newIndex) {
    _currentIndex = newIndex;
    notifyListeners();
  }
}