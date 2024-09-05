import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';

class SolutionSection extends StatelessWidget {
  const SolutionSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(600, 200, 600, 200),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text('Our Solution', style: MainTheme.problemText,),
          Text('By developing and utilising advanced, innovative, autonomous kitchens,\nwe hope to provide healthy, nutritious food to anyone,\neven in the most extreme environments beyond planet Earth.'),
        ],
      ),
    );
  }
}
