import 'package:flutter/material.dart';
import 'package:frontend/utils/helpers.dart';

class PersonCard extends StatelessWidget {
  final String imagePath;
  final String name;
  final String jobRole;

  const PersonCard(
      {super.key,
      required this.imagePath,
      required this.name,
      required this.jobRole});


  @override
  Widget build(BuildContext context) {

    String profilePath;
    switch (name) {
      case 'Aswath GI':
        profilePath = 'https://www.linkedin.com/in/aswathgi/';
      case 'Adip Das':
        profilePath = 'https://www.linkedin.com/in/adip-das1998/';
      case 'Tuan Nguyen':
        profilePath = 'https://www.linkedin.com/in/nctune2808/';
      case 'Chris Mitchell':
        profilePath = 'https://www.linkedin.com/in/christopher-mitchell-628458256/';
      case 'Jake Callcut':
        profilePath = 'https://www.linkedin.com/in/j-callcut/';
      case 'Bailey Tuddenham':
        profilePath = 'https://www.linkedin.com/in/baileytuddenham/';
        break;

      default:
        profilePath = '';
    }

    return Padding(
      padding: const EdgeInsets.all(30.0),
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          minWidth: 0,
          minHeight: 0,
          maxWidth: 300,
          maxHeight: 400,
        ),
        child: Container(
          decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  spreadRadius: 2,
                  offset: const Offset(0, 1),
                )
              ]),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              Image.asset(imagePath),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: const TextStyle(fontSize: 20),
                        ),
                        Text(
                          jobRole,
                          style:
                              const TextStyle(color: Colors.grey, fontSize: 14),
                        )
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: MouseRegion(cursor: SystemMouseCursors.click, child: GestureDetector(onTap: () => Helpers.SendToUrl(profilePath), child: Image.asset('assets/images/link.png'))),
                  )
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
}
