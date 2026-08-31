import 'package:flutter/material.dart';
import 'package:frontend/utils/helpers.dart';

class JobPosting extends StatelessWidget {
  final String title;
  final String location;
  final String jobType;
  final String description;

  const JobPosting(
      {super.key,
      required this.title,
      required this.location,
      required this.jobType,
      required this.description});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 16.0),
      width: MediaQuery.of(context).size.width * 0.7,
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8.0),
        border: Border.all(color: Colors.grey[700]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            spreadRadius: 2,
            blurRadius: 5,
            offset: Offset(0, 3), // changes position of shadow
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 8),
          Text(location),
          SizedBox(height: 8),
          Text(jobType),
          SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(child: Text(description)),
              const SizedBox(width: 16),
              Semantics(
                button: true,
                label: 'Apply for $title',
                child: InkWell(
                  onTap: () => Helpers.SendToSameTab(
                    Uri.base
                        .resolve(
                            '/apply?role=${Uri.encodeQueryComponent(title)}')
                        .toString(),
                  ),
                  child: Padding(
                    padding:
                        const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                    child: Row(
                      children: [
                        Text(
                          'Apply',
                          style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.grey[700]),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          Icons.link,
                          color: Colors.grey[700],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
