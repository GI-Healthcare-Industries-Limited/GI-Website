import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/providers/navigation_provider.dart';

void main() {
  test('contact navigation opens the new same-domain form', () {
    final destinations = <String>[];
    final navigation = NavigationProvider(openContact: destinations.add);
    navigation.updateIndex(5);
    expect(destinations, ['/contact']);
    expect(navigation.currentIndex, 0);
    navigation.updateIndex(4);
    expect(navigation.currentIndex, 4);
  });
}
