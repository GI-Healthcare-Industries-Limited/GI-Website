import 'package:flutter/material.dart';
import 'package:frontend/utils/butterfly_spot.dart';

class MachineMapSection extends StatelessWidget {
  const MachineMapSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final mapWidth = constraints.maxWidth;
            final mapHeight = constraints.maxHeight;

            return Stack(
              children: [
                Positioned.fill(
                  child: Image.asset(
                    'assets/images/machine_map.png',
                    fit: BoxFit.cover,
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.4,
                  left: mapWidth * 0.4,
                  child: const ButterflySpot(
                    title: 'Aircraft',
                    text:
                        'Our machines can be found in various aircraft,\nfrom cargo planes to commercial jets\nour system is built to operate\nin the most extreme environments',
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.45,
                  left: mapWidth * 0.2,
                  child: const ButterflySpot(
                    title: 'Heavy Industry',
                    text: 'Our machines are capable of operating in all\nheavy industry plants and factories\nfeeding factory workers essential meals',
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.85,
                  left: mapWidth * 0.3,
                  child: const ButterflySpot(
                    title: 'Submarines',
                    text: 'Even in the extreme pressure and difficulty,\nour machines are still able to autonomously\nprovide healthy food deep underwater',
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
