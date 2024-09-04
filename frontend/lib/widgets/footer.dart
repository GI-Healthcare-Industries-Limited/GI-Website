import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:frontend/utils/helpers.dart';

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
                const Text(
                  'Copyright © 2024 GI Healthcare Industries Ltd.',
                  style: MainTheme.bodyText,
                ),
              ],
            ),
          ),
          Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Row(
                  children: [
                    const Column(
                      children: [
                      Text('HQ Address', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),),
                      Text(
                        '1F23, Student Ventures UWE,\nFrenchay, Bristol,\nBS16 1QY',
                        style: MainTheme.smallPrint,
                      )
                    ]),
                    Image.asset(
                      'lib/assets/images/hq_address.png',
                      height: 80,
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Row(
                  children: [
                    const Column(children: [
                      Text('R&D Address', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),),
                      Text(
                        'The National Robotarium,\nBoundary Road North,\nEdinburgh,\nEH14 4AS',
                        style: MainTheme.smallPrint,
                      )
                    ]),
                    Image.asset(
                      'lib/assets/images/rd_address.png',
                      height: 80,
                    ),
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
