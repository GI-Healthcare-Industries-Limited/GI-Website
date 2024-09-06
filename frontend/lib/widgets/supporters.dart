import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';

class Supporters extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(400, 100, 400, 80),
      child: Column(
        children: [
          const Text(
            'Our Supporters',
            style: MainTheme.problemText,
          ),
          const SizedBox(height: 40,),
          Wrap(
            spacing: 20.0,
            runSpacing: 20,
            alignment: WrapAlignment.center,
            children: [
              Image.asset('assets/images/mod.png', width: 200),
              Image.asset('assets/images/uksa.png', width: 200),
              Image.asset('assets/images/innovate_uk.png', width: 200),
              Image.asset('assets/images/eagle_labs.png', width: 200),
              Image.asset('assets/images/uwe.png', width: 200),
              Image.asset('assets/images/hwu.png', width: 200),
              Image.asset('assets/images/uob.png', width: 200),
              Image.asset('assets/images/santander.png', width: 200),
              Image.asset('assets/images/nr.png', width: 200),
            ],
          ),
        ],
      ),
    );
  }
}
