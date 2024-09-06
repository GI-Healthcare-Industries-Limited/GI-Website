import 'package:flutter/material.dart';
import 'package:frontend/utils/butterfly_spot.dart';

class MachineMapSection extends StatelessWidget {
  const MachineMapSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned(child: Image.asset('assets/images/machine_map.png')),
        const Positioned(top: 400, left: 400, child: ButterflySpot(title: 'Aircraft', text: 'Our Machines can be found in various aircraft,\nfrom cargo planes to commercial jets\nour system is built to operate\nin the most extreme environments',)),
      ],
    );
  }
}