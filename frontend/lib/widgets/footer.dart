import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:frontend/utils/helpers.dart';
import 'package:frontend/widgets/linked_image.dart';

class Footer extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: MainTheme.giRed,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 0, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Image.asset(
                  'lib/assets/images/logo.png',
                  height: 60,
                ),
                const SizedBox(height: 30,),
                const Text(
                  'Contact Us',
                  style: MainTheme.headerText,
                ),
                InkWell(
                  onTap: () =>
                      Helpers.SendToUrl('mailto:info@gihealthcare.co.uk'),
                  child: const Text(
                    'info@gihealthcare.co.uk',
                    style: MainTheme.linkText,
                  ),
                ),
                const Text(
                  '+44 131 392 8881',
                  style: MainTheme.bodyText,
                ),
                InkWell(
                  onTap: () => Helpers.SendToUrl(
                      'https://www.linkedin.com/company/gihil/'),
                  child: const Text(
                    'LinkedIn',
                    style: MainTheme.linkText,
                  ),
                ),
                const SizedBox(height: 30,),
                const Text(
                  'Copyright © 2024 GI Healthcare Industries Ltd.',
                  style: MainTheme.bodyText,
                ),
              ],
            ),
          ),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Padding(
                padding: EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    Padding(
                      padding: EdgeInsets.fromLTRB(0, 0, 8, 0),
                      child: Column(
                        children: [
                        Text(
                          'HQ Address:',
                          textAlign: TextAlign.right,
                          style: TextStyle(
                              color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          '1F23, Student Ventures UWE,\nFrenchay, Bristol,\nBS16 1QY',
                          textAlign: TextAlign.right,
                          style: MainTheme.smallPrint,
                        )
                      ]),
                    ),
                    LinkedImage(
                        url:
                            'https://www.google.co.uk/maps/place/Student+Ventures+Incubator/@51.4991367,-2.5494476,17z/data=!3m1!5s0x48719032f1b74bbb:0x474c8d872ad9970c!4m6!3m5!1s0x4871912b7d4f0e85:0x89210e44641bfadb!8m2!3d51.5002995!4d-2.5475728!16s%2Fg%2F11h80fxjft?entry=ttu&g_ep=EgoyMDI0MDgyOC4wIKXMDSoASAFQAw%3D%3D',
                        imagePath: 'lib/assets/images/hq_address.png')
                  ],
                ),
              ),
              Padding(
                padding: EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    Padding(
                      padding: EdgeInsets.fromLTRB(0, 0, 8, 0),
                      child: Column(children: [
                        Text(
                          'R&D Address:',
                          textAlign: TextAlign.right,
                          style: TextStyle(
                              color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'The National Robotarium,\nBoundary Road North,\nEdinburgh,\nEH14 4AS',
                          textAlign: TextAlign.right,
                          style: MainTheme.smallPrint,
                        ),
                      ]),
                    ),
                    LinkedImage(
                        url:
                            'https://www.google.co.uk/maps/place/The+National+Robotarium/@55.9127033,-3.3270417,17z/data=!4m6!3m5!1s0x4887c5688c2f288f:0x29e1dbe3022d32cc!8m2!3d55.9127033!4d-3.3248765!16s%2Fg%2F11rt_bz8jz?entry=ttu&g_ep=EgoyMDI0MDgyOC4wIKXMDSoASAFQAw%3D%3D',
                        imagePath: 'lib/assets/images/rd_address.png')
                  ],
                ),
              ),
            ],
          )
        ],
      ),
    );
  }
}
