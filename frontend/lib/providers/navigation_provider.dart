import 'dart:async';
import 'package:flutter/material.dart';
import 'package:frontend/pages/careers_page.dart';
import 'package:frontend/pages/home_page.dart';
import 'package:frontend/utils/helpers.dart';
import 'package:frontend/utils/site_location.dart' as location;
import 'package:frontend/utils/site_routes.dart';

class NavigationProvider with ChangeNotifier {
  NavigationProvider({
    void Function(String)? openContact,
    Uri? initialLocation,
    void Function(Uri)? writeLocation,
    Stream<Uri>? locationChanges,
  }) : _openContact = openContact ?? Helpers.SendToSameTab,
       _location = initialLocation ?? location.currentLocation(),
       _writeLocation = writeLocation ?? location.writeLocation {
    _currentIndex = pageIndexFromLocation(_location);
    _locationSubscription = (locationChanges ?? location.locationChanges).listen((uri) {
      _location = uri;
      final nextIndex = pageIndexFromLocation(uri);
      if (nextIndex != _currentIndex) {
        _currentIndex = nextIndex;
        notifyListeners();
      }
    });
  }

  final void Function(String) _openContact;
  final void Function(Uri) _writeLocation;
  late final StreamSubscription<Uri> _locationSubscription;
  Uri _location;
  int _currentIndex = 0;

  final List<Widget> _pages = [
    const HomePage(),
    const SizedBox.shrink(), // Research is served by Next.js at /research.
    const CareersPage(),
  ];

  // Get the current index
  int get currentIndex => _currentIndex;

  // Get the current page
  Widget get currentPage => _pages[_currentIndex];

  // Function to update the current index and notify listeners
  void updateIndex(int newIndex) {
    if (newIndex == 1) {
      _openContact('/research');
      return;
    }
    if (newIndex == sitePageNames.length) {
      _openContact('/contact');
      return;
    }
    if (newIndex < 0 || newIndex >= _pages.length) return;
    if (newIndex == _currentIndex) return;
    _currentIndex = newIndex;
    _location = locationForPage(_location, newIndex);
    _writeLocation(_location);
    notifyListeners();
  }

  @override
  void dispose() {
    _locationSubscription.cancel();
    super.dispose();
  }
}
