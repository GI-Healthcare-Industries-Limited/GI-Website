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
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          SingleChildScrollView(
            controller: _scrollController,
            child: const Center(
              child: Column(
                children: [
                  Padding(
                    padding: EdgeInsets.fromLTRB(300, 200, 300, 60),
                    child: Column(
                      children: [
                        Text('About Us', style: MainTheme.problemText,),
                        Padding(
                          padding: EdgeInsets.fromLTRB(200, 120, 200, 16),
                          child: AboutCard(
                            title: 'Vision',
                            text:
                                'Lorem ipsum odor amet, consectetuer adipiscing elit. Enim eleifend nec magna cubilia sagittis aptent auctor pellentesque. Ligula ad turpis etiam luctus eu ante, luctus pellentesque. Duis sapien habitant molestie commodo praesent velit scelerisque habitasse. Mollis ridiculus a aenean efficitur curae sodales ligula. Ex netus sociosqu himenaeos vivamus ante quam congue dignissim. Vulputate sapien magna conubia congue praesent urna. Adipiscing curae magnis sem platea nec vivamus. Aliquet tristique semper tempor lacinia placerat montes condimentum.',
                          ),
                        ),
                        Padding(
                          padding: EdgeInsets.fromLTRB(200, 16, 200, 16),
                          child: AboutCard(
                            title: 'Mission',
                            text:
                                'Lorem ipsum odor amet, consectetuer adipiscing elit. Enim eleifend nec magna cubilia sagittis aptent auctor pellentesque. Ligula ad turpis etiam luctus eu ante, luctus pellentesque. Duis sapien habitant molestie commodo praesent velit scelerisque habitasse. Mollis ridiculus a aenean efficitur curae sodales ligula. Ex netus sociosqu himenaeos vivamus ante quam congue dignissim. Vulputate sapien magna conubia congue praesent urna. Adipiscing curae magnis sem platea nec vivamus. Aliquet tristique semper tempor lacinia placerat montes condimentum.',
                          ),
                        ),
                        SizedBox(height: 200,),
                        Text(
                          'Meet the Team',
                          style: MainTheme.problemText,
                        ),
                        Wrap(
                          children: [
                            PersonCard(
                                imagePath: 'assets/images/ash.png',
                                name: 'Aswath GI',
                                jobRole: 'CEO'),
                            PersonCard(
                                imagePath: 'assets/images/adip.png',
                                name: 'Adip Das',
                                jobRole: 'CTO'),
                            PersonCard(
                                imagePath: 'assets/images/tuan.png',
                                name: 'Tuan Nguyen',
                                jobRole: 'Software Engineer'),
                            PersonCard(
                                imagePath: 'assets/images/chris.png',
                                name: 'Chris Mitchell',
                                jobRole: 'Robotics Engineer'),
                            PersonCard(
                                imagePath: 'assets/images/jake.png',
                                name: 'Jake Callcut',
                                jobRole: 'Software Developer'),
                            PersonCard(
                                imagePath: 'assets/images/bailey.png',
                                name: 'Bailey Tuddenham',
                                jobRole: 'Design Engineer'),
                          ],
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
