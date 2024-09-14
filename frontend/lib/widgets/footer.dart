import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:frontend/utils/helpers.dart';
import 'package:frontend/widgets/linked_image.dart';

class Footer extends StatelessWidget {

  @override
  Widget build(BuildContext context) {

  final screenWidth = MediaQuery.of(context).size.width;
  final isMobile = screenWidth < 1600;

    return Container(
      color: MainTheme.giRed,
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 0, 8),
                child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Image.asset(
                        'assets/images/logo.png',
                        height: 80,
                      ),
                      const Text(
                        'Healthy food for anyone, anytime, anywhere',
                        style: MainTheme.smallPrint,
                      ),
                    ]),
              ),
              if(!isMobile) Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Text(
                      'Contact Us',
                      style: MainTheme.headerText,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Row(
                      children: [
                        const Padding(
                          padding: EdgeInsets.all(8.0),
                          child: Icon(
                            Icons.email,
                            size: 20,
                            color: Colors.white,
                          ),
                        ),
                        InkWell(
                          onTap: () => Helpers.SendToUrl(
                              'mailto:info@gihealthcare.co.uk'),
                          child: const Text(
                            'info@gihealthcare.co.uk',
                            style: MainTheme.linkText,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Row(
                      children: [
                        Padding(
                          padding: EdgeInsets.all(8.0),
                          child: Icon(
                            Icons.phone_rounded,
                            size: 20,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          '+44 131 392 8881',
                          style: MainTheme.bodyText,
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Row(
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Image.asset('assets/images/linkedin.png', height: 20,),
                        ),
                        InkWell(
                          onTap: () => Helpers.SendToUrl(
                              'https://www.linkedin.com/company/gihil/'),
                          child: const Text(
                            'LinkedIn',
                            style: MainTheme.linkText,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if(!isMobile) const Row(
                children: [
                  Padding(
                    padding: EdgeInsets.fromLTRB(16, 32, 16, 32),
                    child: Row(
                      children: [
                        Padding(
                          padding: EdgeInsets.fromLTRB(0, 0, 8, 0),
                          child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('HQ Address:',
                                    textAlign: TextAlign.left,
                                    style: MainTheme.headerText),
                                Text(
                                  '1F23, Student Ventures UWE,\nFrenchay, Bristol,\nBS16 1QY',
                                  textAlign: TextAlign.left,
                                  style: MainTheme.bodyText,
                                ),
                                SizedBox(
                                  height: 70,
                                ),
                              ]),
                        ),
                        LinkedImage(
                            url:
                                'https://www.google.co.uk/maps/place/Student+Ventures+Incubator/@51.4991367,-2.5494476,17z/data=!3m1!5s0x48719032f1b74bbb:0x474c8d872ad9970c!4m6!3m5!1s0x4871912b7d4f0e85:0x89210e44641bfadb!8m2!3d51.5002995!4d-2.5475728!16s%2Fg%2F11h80fxjft?entry=ttu&g_ep=EgoyMDI0MDgyOC4wIKXMDSoASAFQAw%3D%3D',
                            imagePath: 'assets/images/hq_address.png')
                      ],
                    ),
                  ),
                  SizedBox(
                    width: 50,
                  ),
                  Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Row(
                      children: [
                        Padding(
                          padding: EdgeInsets.fromLTRB(0, 0, 16, 0),
                          child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'R&D Address:',
                                  textAlign: TextAlign.left,
                                  style: MainTheme.headerText,
                                ),
                                Text(
                                  'The National Robotarium,\nBoundary Road North,\nEdinburgh,\nEH14 4AS',
                                  textAlign: TextAlign.left,
                                  style: MainTheme.bodyText,
                                ),
                                SizedBox(
                                  height: 70,
                                ),
                              ]),
                        ),
                        LinkedImage(
                            url:
                                'https://www.google.co.uk/maps/place/The+National+Robotarium/@55.9127033,-3.3270417,17z/data=!4m6!3m5!1s0x4887c5688c2f288f:0x29e1dbe3022d32cc!8m2!3d55.9127033!4d-3.3248765!16s%2Fg%2F11rt_bz8jz?entry=ttu&g_ep=EgoyMDI0MDgyOC4wIKXMDSoASAFQAw%3D%3D',
                            imagePath: 'assets/images/rd_address.png'),
                        SizedBox(
                          width: 50,
                        ),
                      ],
                    ),
                  ),
                ],
              )
            ],
          ),
          const Text(
            'Copyright © 2024 GI Healthcare Industries Ltd.',
            style: MainTheme.smallPrint,
          )
        ],
      ),
    );
  }
}
