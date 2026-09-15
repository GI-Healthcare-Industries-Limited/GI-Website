import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:frontend/providers/navigation_provider.dart';
import 'package:frontend/widgets/navigation_bar.dart';

void main() {
  Future<NavigationProvider> mount(WidgetTester tester, double width, List<String> destinations) async {
    tester.view.physicalSize = Size(width, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final navigation = NavigationProvider(openContact: destinations.add);
    addTearDown(navigation.dispose);
    await tester.pumpWidget(ChangeNotifierProvider.value(value: navigation,
      child: const MaterialApp(home: Scaffold(body: NavBar()))));
    await tester.pumpAndSettle();
    return navigation;
  }

  testWidgets('desktop header keeps all six links, orbit logo and Contact routing', (tester) async {
    final destinations = <String>[];
    final navigation = await mount(tester, 1440, destinations);
    for (final label in ['Home','About us','Military','Space','Careers','Contact us']) {
      expect(find.widgetWithText(TextButton, label), findsOneWidget);
    }
    expect(find.text('Menu'), findsNothing);
    expect((tester.widget<Image>(find.byType(Image)).image as AssetImage).assetName, 'assets/images/gi-healthcare-logo.png');
    expect(tester.getSize(find.byType(NavBar)).height, 76);
    await tester.tap(find.text('About us'));
    expect(navigation.currentIndex, 1);
    await tester.tap(find.text('Contact us'));
    expect(destinations, ['/contact']);
    expect(tester.takeException(), isNull);
  });

  testWidgets('mobile disclosure opens full navigation, selects a page and closes with Escape', (tester) async {
    final navigation = await mount(tester, 390, []);
    expect(tester.getSize(find.byType(NavBar)).height, 68);
    expect(find.text('Careers'), findsNothing);
    await tester.tap(find.text('Menu'));
    await tester.pumpAndSettle();
    expect(find.text('Careers'), findsOneWidget);
    await tester.tap(find.text('Careers'));
    await tester.pumpAndSettle();
    expect(navigation.currentIndex, 4);
    expect(find.text('Careers'), findsNothing);
    await tester.tap(find.text('Menu'));
    await tester.pumpAndSettle();
    await tester.sendKeyEvent(LogicalKeyboardKey.escape);
    await tester.pumpAndSettle();
    expect(find.text('Careers'), findsNothing);
    expect(tester.takeException(), isNull);
  });
}
