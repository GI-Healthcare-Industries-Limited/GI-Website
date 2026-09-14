import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/providers/navigation_provider.dart';
import 'package:frontend/utils/site_routes.dart';

void main() {
  test('contact navigation opens the new same-domain form', () {
    final destinations = <String>[];
    final navigation = NavigationProvider(openContact: destinations.add);
    addTearDown(navigation.dispose);
    navigation.updateIndex(5);
    expect(destinations, ['/contact']);
    expect(navigation.currentIndex, 0);
    navigation.updateIndex(4);
    expect(navigation.currentIndex, 4);
  });

  test('website links open the requested public page directly', () {
    for (var index = 0; index < sitePageNames.length; index++) {
      final navigation = NavigationProvider(initialLocation:
          Uri.parse('https://gihealthcare.co.uk/?page=${sitePageNames[index]}'));
      expect(navigation.currentIndex, index);
      navigation.dispose();
    }
    expect(pageIndexFromLocation(Uri.parse('https://gihealthcare.co.uk/?page=unknown')), 0);
    expect(pageIndexFromLocation(Uri.parse('https://gihealthcare.co.uk/')), 0);
  });

  test('navigation updates the address and browser history restores the page', () async {
    final changes = StreamController<Uri>(sync: true);
    final addresses = <Uri>[];
    final navigation = NavigationProvider(
      initialLocation: Uri.parse('https://gihealthcare.co.uk/?page=about&ref=example'),
      writeLocation: addresses.add, locationChanges: changes.stream,
    );
    navigation.updateIndex(3);
    expect(addresses.single.queryParameters, {'page': 'space', 'ref': 'example'});
    expect(navigation.currentIndex, 3);
    changes.add(Uri.parse('https://gihealthcare.co.uk/?page=about'));
    expect(navigation.currentIndex, 1);
    expect(addresses.length, 1); // Back/forward must not push another entry.
    navigation.updateIndex(0);
    expect(addresses.last.toString(), 'https://gihealthcare.co.uk/');
    navigation.updateIndex(0);
    navigation.updateIndex(-1);
    navigation.updateIndex(99);
    expect(addresses.length, 2); // No duplicate or invalid entries.
    navigation.dispose();
    expect(changes.hasListener, false);
    await changes.close();
  });
}
