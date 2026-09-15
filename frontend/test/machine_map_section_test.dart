import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/widgets/machine_map_section.dart';
import 'package:frontend/utils/butterfly_spot.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(() async {
    final font = FontLoader('Inter')..addFont(rootBundle.load('assets/fonts/Inter.ttf'));
    await font.load();
  });
  for (final width in [390.0, 1000.0, 1440.0]) {
    testWidgets('mission stays readable and map remains intact at $width', (tester) async {
      tester.view.physicalSize = Size(width, 1000);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(const MaterialApp(home: Scaffold(
        body: SingleChildScrollView(child: MachineMapSection()),
      )));
      await tester.pumpAndSettle();
      final mission = find.textContaining('Our mission is to make');
      expect(mission, findsOneWidget);
      expect(find.byType(ButterflySpot), width < 1000 ? findsNothing : findsNWidgets(15));
      final rect = tester.getRect(mission);
      expect(rect.left, greaterThanOrEqualTo(0));
      expect(rect.right, lessThanOrEqualTo(width));
      if (width >= 1000) expect(rect.bottom, lessThan(width * 9 / 16 * .45));
      expect(tester.takeException(), isNull);
    });
  }
}
