import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:frontend/widgets/navigation_bar.dart';
import 'package:frontend/widgets/person_card.dart';
import 'package:frontend/widgets/about_card.dart';

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
    final screenWidth = MediaQuery.of(context).size.width;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          SingleChildScrollView(
            controller: _scrollController,
            child: Center(
              child: Column(
                children: [
                  Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: screenWidth * 0.1,
                      vertical: 60,
                    ),
                    child: Column(
                      children: [
                        const SizedBox(height: 60,),
                        Text(
                          'About Us',
                          style: MainTheme.problemText.copyWith(
                            fontSize: screenWidth < 1200 ? 24 : 32,
                          ),
                        ),
                        Padding(
                          padding: EdgeInsets.symmetric(
                            horizontal: screenWidth < 1200 ? 16 : 200,
                            vertical: 16,
                          ),
                          child: const AboutCard(
                            title: 'Vision',
                            text:
                                'At GI Healthcare, our vision is to revolutionize the future of food by making freshly cooked, nutritious meals accessible in every corner of the world and beyond. Through cutting-edge autonomous cooking technology, we strive to empower individuals and organizations in even the most extreme environments—from bustling urban centers to remote military bases and space missions—by providing healthy, reliable, and sustainable food solutions.',
                          ),
                        ),
                        Padding(
                          padding: EdgeInsets.symmetric(
                            horizontal: screenWidth < 1200 ? 16 : 200,
                            vertical: 16,
                          ),
                          child: const AboutCard(
                            title: 'Mission',
                            text:
                                'Our mission is to pioneer the development of advanced autonomous cooking systems that deliver high-quality, nutritious meals with minimal human intervention. We are committed to addressing the unique food challenges faced in extreme environments by creating innovative solutions that enhance health, sustainability, and operational efficiency. By integrating technology, nutrition, and convenience, we aim to serve fresh, healthy food anywhere on Earth—and beyond.',
                          ),
                        ),
                        const SizedBox(height: 40),
                        Text(
                          'Meet the Team',
                          style: MainTheme.problemText.copyWith(
                            fontSize: screenWidth < 1200 ? 24 : 32,
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Wrap(
                            alignment: WrapAlignment.center,
                            spacing: 16,
                            runSpacing: 16,
                            children: [
                              PersonCard(
                                imagePath: 'assets/images/ash.png',
                                name: 'Aswath GI',
                                jobRole: 'CEO',
                              ),
                              PersonCard(
                                imagePath: 'assets/images/adip.png',
                                name: 'Adip Das',
                                jobRole: 'CTO',
                              ),
                              PersonCard(
                                imagePath: 'assets/images/tuan.png',
                                name: 'Tuan Nguyen',
                                jobRole: 'Software Engineer',
                              ),
                              PersonCard(
                                imagePath: 'assets/images/chris.png',
                                name: 'Chris Mitchell',
                                jobRole: 'Robotics Engineer',
                              ),
                              PersonCard(
                                imagePath: 'assets/images/jake.png',
                                name: 'Jake Callcut',
                                jobRole: 'Software Developer',
                              ),
                              PersonCard(
                                imagePath: 'assets/images/bailey.png',
                                name: 'Bailey Tuddenham',
                                jobRole: 'Design Engineer',
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const NavBar(isTransparent: false),
        ],
      ),
    );
  }
}
