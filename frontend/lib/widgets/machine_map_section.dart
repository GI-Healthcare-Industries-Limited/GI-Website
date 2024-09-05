import 'package:flutter/material.dart';

class MachineMapSection extends StatelessWidget {
  const MachineMapSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      child: Stack(
        children: [
          Positioned(child: Image.asset('assets/images/machine_map.png'))
        ],
      ),
    );
  }
}