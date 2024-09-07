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
                  top: mapHeight * 0.35,
                  left: mapWidth * 0.8,
                  child: const ButterflySpot(
                    title: 'Heavy Industry',
                    text:
                        'Our machines are capable of operating in all heavy industry plants and factories feeding factory workers essential meals.',
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.85,
                  left: mapWidth * 0.3,
                  child: const ButterflySpot(
                    title: 'Submarines',
                    text:
                        'Even in the extreme pressure and difficulty, our machines are still able to autonomously provide healthy food deep underwater.',
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.1,
                  left: mapWidth * 0.3,
                  child: const ButterflySpot(
                    title: 'Satellites',
                    text:
                        'Using unique and innovative methods, our machines are capable of combatting the challenges that come along with a zero-gravity environment.',
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.1,
                  left: mapWidth * 0.6,
                  child: const ButterflySpot(
                    title: 'Other Planets',
                    text:
                        'Even beyond earth, our machines can use unique low-gravity cooking methods and rugged design to potentially operate anywhere in the solar system.',
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.5,
                  left: mapWidth * 0.1,
                  child: const ButterflySpot(
                    title: 'Trains',
                    text:
                        'From passenger trains to long distance freight, you can find our machines able to operate!',
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.8,
                  left: mapWidth * 0.1,
                  child: const ButterflySpot(
                    title: 'Deep Sea Research',
                    text:
                        'New and ingenious deep sea research centres are popping up all over the world, our systems are waiting to serve them.',
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.78,
                  left: mapWidth * 0.5,
                  child: const ButterflySpot(
                    title: 'Military Bases',
                    text:
                        'Our main area of focus is providing food to forward operating bases for the UK Military, providing freshly cooked food to soldiers all over the world.',
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.8,
                  left: mapWidth * 0.78,
                  child: const ButterflySpot(
                    title: 'Marine Services',
                    text:
                        'Our machines are able to service the hard-working professionals in all areas of the Marine field, oil rigs, the navy, or cargo ships.',
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.6,
                  left: mapWidth * 0.7,
                  child: const ButterflySpot(
                    title: 'Residential',
                    text:
                        'Whether in small residential homes or large care facilities, our machines are committed to delivering balanced meals, supporting carers and residents alike.',
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.6,
                  left: mapWidth * 0.55,
                  child: const ButterflySpot(
                    title: 'Offices',
                    text:
                        'Our machines are designed to seamlessly integrate into office buildings, offering employees fresh, healthy meals in the most efficient manner.',
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.5,
                  left: mapWidth * 0.5,
                  child: const ButterflySpot(
                    title: 'Disaster Relief',
                    text:
                        'In the heart of disaster relief efforts, our systems can be rapidly deployed to provide hot meals to first responders and those affected by crisis situations.',
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.45,
                  left: mapWidth * 0.4,
                  child: const ButterflySpot(
                    title: 'Festivals & Events',
                    text:
                        'From vibrant festivals to massive concert venues, our systems ensure attendees and staff are served quickly and efficiently, even in high-demand environments.',
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.65,
                  left: mapWidth * 0.4,
                  child: const ButterflySpot(
                    title: 'Universities',
                    text:
                        'When it comes to universities, our machines are ready to fuel the minds of students and staff alike, providing healthy meals across campuses.',
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.55,
                  left: mapWidth * 0.35,
                  child: const ButterflySpot(
                    title: 'Hospitals',
                    text:
                        'Our machines are perfectly designed to serve the dedicated staff across the NHS, ensuring hospital workers can access nutritious meals 24/7.',
                  ),
                ),
                Positioned(
                  top: mapHeight * 0.45,
                  left: mapWidth * 0.2,
                  child: const ButterflySpot(
                    title: 'Aircraft',
                    text:
                        'Our machines can be found in various aircraft, from cargo planes to commercial jets our system is built to operate\nin the most extreme environments.',
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
