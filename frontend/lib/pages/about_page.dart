import 'package:flutter/material.dart';
import 'package:frontend/widgets/background_video_page.dart';
import 'package:frontend/widgets/footer.dart';
import 'package:frontend/widgets/machine_map_section.dart';
import 'package:frontend/widgets/navigation_bar.dart';
import 'package:frontend/widgets/person_card.dart';
import 'package:frontend/widgets/problem_section.dart';
import 'package:frontend/widgets/solution_section.dart';
import 'package:frontend/widgets/supporters.dart';

class AboutPage extends StatefulWidget {
  const AboutPage({super.key});

  @override
  _AboutPageState createState() => _AboutPageState();
}

class _AboutPageState extends State<AboutPage> {
  final ScrollController _scrollController = ScrollController();
  bool _isAtTop = true;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.position.pixels == 0 && !_isAtTop) {
      setState(() {
        _isAtTop = true;
      });
    } else if (_scrollController.position.pixels > 0 && _isAtTop) {
      setState(() {
        _isAtTop = false;
      });
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          SingleChildScrollView(
            controller: _scrollController,
            child: const Column(
              children: [
                Center(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(300, 200, 300, 60),
                    child: Wrap(
                      children: [
                        PersonCard(imagePath: 'assets/images/ash.png', name: 'Aswath GI', jobRole: 'CEO'),
                        PersonCard(imagePath: 'assets/images/adip.png', name: 'Adip Das', jobRole: 'CTO'),
                        PersonCard(imagePath: 'assets/images/tuan.png', name: 'Tuan Nguyen', jobRole: 'Software Engineer'),
                        PersonCard(imagePath: 'assets/images/chris.png', name: 'Chris Mitchell', jobRole: 'Robotics Engineer'),
                        PersonCard(imagePath: 'assets/images/jake.png', name: 'Jake Callcut', jobRole: 'Software Developer'),
                        PersonCard(imagePath: 'assets/images/bailey.png', name: 'Bailey Tuddenham', jobRole: 'Design Engineer'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const NavBar(isTransparent: false),
        ],
      ),
    );
  }
}
