import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';

class SolutionSection extends StatelessWidget {
  const SolutionSection({super.key});

  @override
  Widget build(BuildContext context) {
    // Get screen width to determine if we're on mobile or desktop
    final screenWidth = MediaQuery.of(context).size.width;
    final bool isMobile = screenWidth < 600;

    return Container(
      color: Colors.white,
      padding: isMobile? EdgeInsets.fromLTRB(screenWidth/5, 200, screenWidth/5, 200): EdgeInsets.fromLTRB(screenWidth/3, 200, screenWidth/3, 200),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            'Our Solution',
            style: MainTheme.problemText, 
            textAlign: TextAlign.center, 
          ),
          SizedBox(height: 16), 
          Text(
            'By developing and utilising advanced, innovative, autonomous kitchens,\n'
            'we hope to provide healthy, nutritious food to anyone,\n'
            'even in the most extreme environments beyond planet Earth.',
            textAlign: TextAlign.center, 
            style: TextStyle(fontSize: 18), 
          ),
        ],
      ),
    );
  }
}
