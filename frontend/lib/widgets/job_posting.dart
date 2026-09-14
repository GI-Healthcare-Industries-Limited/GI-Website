import 'package:flutter/material.dart';
import 'package:frontend/utils/helpers.dart';
import 'package:intl/intl.dart';

class JobPosting extends StatelessWidget {
  final String id;
  final String title;
  final String location;
  final String jobType;
  final String department;
  final String description;
  final bool isOpen;
  final String? closingDate;
  final String? startDate;

  const JobPosting({
    super.key,
    required this.id,
    required this.title,
    required this.location,
    required this.jobType,
    required this.department,
    required this.description,
    required this.isOpen,
    this.closingDate,
    this.startDate,
  });

  String _date(String value) =>
      DateFormat('d MMMM yyyy').format(DateTime.parse(value));

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 16),
      width: MediaQuery.of(context).size.width *
          (MediaQuery.of(context).size.width < 700 ? 0.9 : 0.7),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xffd8ddd1)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        Text('$location · $jobType · $department',
            style: const TextStyle(color: Color(0xff626b57))),
        const SizedBox(height: 16),
        Text(description),
        const SizedBox(height: 18),
        Text(closingDate == null
            ? 'No closing date'
            : 'Apply by ${_date(closingDate!)} · 11:59 pm UK time'),
        const SizedBox(height: 6),
        Text(startDate == null
            ? 'Proposed start: To be agreed'
            : 'Proposed start: ${_date(startDate!)}'),
        const SizedBox(height: 18),
        if (isOpen)
          OutlinedButton.icon(
            onPressed: () => Helpers.SendToSameTab(Uri.base
                .resolve('/apply?job=${Uri.encodeQueryComponent(id)}')
                .toString()),
            icon: const Icon(Icons.arrow_forward, size: 18),
            label: Text('Apply for $title'),
          )
        else
          const Text('Applications closed',
              style: TextStyle(
                  color: Color(0xffa33238), fontWeight: FontWeight.w600)),
      ]),
    );
  }
}
