import 'package:flutter/material.dart';
import 'package:frontend/widgets/footer.dart';
import 'package:frontend/widgets/navigation_bar.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        NavBar(),
        SizedBox(height: 500,), //spacer for now
        Footer(),
      ],
    );
  }
}
