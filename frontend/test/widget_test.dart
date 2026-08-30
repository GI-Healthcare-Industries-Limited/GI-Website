import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/pages/contact_page.dart';

void main() {
  testWidgets('contact form validates required fields', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: EnquiriesBox()),
      ),
    );

    await tester.tap(find.widgetWithText(ElevatedButton, 'Submit'));
    await tester.pump();

    expect(
      find.text('Please enter your name, email address and message.'),
      findsOneWidget,
    );
  });
}
