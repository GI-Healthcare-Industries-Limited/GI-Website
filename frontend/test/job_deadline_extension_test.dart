import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/widgets/job_posting.dart';

void main() {
  for (final extended in [false, true]) {
    for (final open in [false, true]) {
      testWidgets('deadline wording extended=$extended open=$open', (tester) async {
        await tester.pumpWidget(MaterialApp(home: Scaffold(body: SingleChildScrollView(child: JobPosting(
          id: 'synthetic', title: 'Synthetic role', location: 'Edinburgh', jobType: 'Full-time',
          department: 'Engineering', description: 'Synthetic description', isOpen: open,
          closingDate: '2030-10-01', extendedClosingDate: extended ? '2030-10-01' : null,
        )))));
        expect(find.text('${extended ? 'Deadline extended to' : 'Apply by'} 1 October 2030 · 11:59 pm UK time'), findsOneWidget);
        expect(find.text('Applications closed'), open ? findsNothing : findsOneWidget);
        expect(find.text('Apply for Synthetic role'), open ? findsOneWidget : findsNothing);
      });
    }
  }
}
