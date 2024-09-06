import 'package:flutter/material.dart';
import 'package:frontend/utils/butterfly_spot.dart';

class MachineMapSection extends StatelessWidget {
  const MachineMapSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned(child: Image.asset('assets/images/machine_map.png')),
        Positioned(top: 400, left: 400, child: ButterflySpot()),
      ],
    );
  }
}