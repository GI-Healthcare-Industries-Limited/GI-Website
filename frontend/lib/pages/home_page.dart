import 'package:flutter/material.dart';
import 'package:frontend/widgets/footer.dart';
import 'package:frontend/widgets/navigation_bar.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          NavBar(),
          Expanded(
            child: Container(),
          ),
          // Footer snaps to the bottom
          Footer(),
        ],
      ),
    );
  }
}
