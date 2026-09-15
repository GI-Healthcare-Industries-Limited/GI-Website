import 'package:flutter/material.dart';
import 'package:frontend/widgets/machine_map_section.dart';
import 'package:frontend/widgets/navigation_bar.dart';
import 'package:frontend/widgets/supporters.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          NavBar(),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [MachineMapSection(), Supporters()],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
