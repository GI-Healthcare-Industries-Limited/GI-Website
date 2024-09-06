import 'package:flutter/material.dart';
import 'package:frontend/widgets/footer.dart';
import 'package:frontend/widgets/machine_map_section.dart';
import 'package:frontend/widgets/navigation_bar.dart';
import 'package:frontend/widgets/background_video_page.dart';
import 'package:frontend/widgets/problem_section.dart';
import 'package:frontend/widgets/solution_section.dart';
import 'package:frontend/widgets/supporters.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Column(
          children: [
            const NavBar(),
            AspectRatio(
              aspectRatio: 16 / 9, 
              child: BackgroundVideoPage(),
            ),
            const ProblemSection(),
            const SolutionSection(),
            const MachineMapSection(),
            Supporters(),
            Footer(),
          ],
        ),
      ),
    );
  }
}
