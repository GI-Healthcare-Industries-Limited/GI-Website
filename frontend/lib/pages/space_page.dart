import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:frontend/utils/space_backdrop.dart';
import 'package:frontend/widgets/navigation_bar.dart';
import 'package:frontend/widgets/space_text_image.dart';
import 'package:provider/provider.dart';
import '../providers/navigation_provider.dart';

class SpacePage extends StatefulWidget {
  const SpacePage({super.key});

  @override
  _SpacePageState createState() => _SpacePageState();
}

class _SpacePageState extends State<SpacePage> {
  final ScrollController _scrollController = ScrollController();
  bool _isAtTop = true;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    setState(() {
      if (_scrollController.position.pixels == 0 && !_isAtTop) {
        _isAtTop = true;
      } else if (_scrollController.position.pixels > 0 && _isAtTop) {
        _isAtTop = false;
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Calculate values based on screen size.
    double screenWidth = MediaQuery.of(context).size.width;
    double horizontalPadding = screenWidth * 0.05; // 5% of screen width
    horizontalPadding = horizontalPadding < 16 ? 16 : horizontalPadding;

    // Adjust top spacing and bottom spacing based on screen size.
    double topPadding = screenWidth < 600 ? 100.0 : 150.0;
    double extraBottomSpace = screenWidth < 600 ? 500.0 : 1500.0;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          AnimatedBuilder(
            animation: _scrollController,
            builder: (context, child) {
              double scrollOffset = _scrollController.hasClients
                  ? _scrollController.offset
                  : 0.0;
              return SpaceBackdrop(scrollOffset: scrollOffset);
            },
          ),
          SingleChildScrollView(
            controller: _scrollController,
            child: Padding(
              padding: EdgeInsets.only(top: topPadding),
              child: Column(
                children: [
                  // Quote Section
                  Padding(
                    padding: const EdgeInsets.only(top: 30.0, bottom: 30.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20.0),
                          child: Text(
                            '\"Food is much more than just fuel for Astronauts\"',
                            style: MainTheme.quoteText,
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20.0),
                          child: Text(
                            '- Dr. Scott M. Smith, NASA',
                            style: MainTheme.smallPrint,
                          ),
                        ),
                      ],
                    ),
                  ),
                  SpaceTextImage(
                    text:
                        'Astronauts currently have limited food options in space, relying primarily on prepackaged, processed meals and a few raw vegetables. While these meals are carefully designed to meet nutritional needs, the lack of variety and freshness can make it challenging to maintain a balanced diet over long missions. This limited food selection can also impact astronauts\' overall health and morale. With no ability to cook or prepare fresh food in space, staying healthy over extended periods becomes increasingly difficult, highlighting the need for innovative solutions to expand their food options.',
                    imagePath: 'assets/images/astronauts.webp',
                    imageFirst: true,
                  ),
                  // Second Quote Section
                  Padding(
                    padding: const EdgeInsets.only(top: 30.0, bottom: 30.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '\"Food is something that keeps astronauts sane\"',
                          style: MainTheme.quoteText,
                        ),
                        Text(
                          '- Dr Sonja Brungs, European Space Agency',
                          style: MainTheme.smallPrint,
                        ),
                      ],
                    ),
                  ),
                  SpaceTextImage(
                    text:
                        'Recent advancements in growing vegetables in space offer an exciting opportunity to improve astronauts\' diets. NASA and other space agencies have successfully cultivated crops like lettuce, radishes, and even peppers on the International Space Station, providing a valuable source of fresh, nutritious food. While this is a significant step forward, the lack of cooking facilities in space means astronauts are still limited to raw produce. This is where our company sees tremendous potential. We are dedicated to expanding our fresh cooking technology into space, overcoming the challenges of a zero-gravity environment, and bringing freshly prepared meals to astronauts, ultimately enhancing their health and well-being on long missions.',
                    imagePath: 'assets/images/space_garden.webp',
                    imageFirst: false,
                  ),
                  // Call-to-Action Section
                  Padding(
                    padding: EdgeInsets.fromLTRB(
                        horizontalPadding, screenWidth < 600 ? 150.0 : 200.0, horizontalPadding, 20.0),
                    child: Text(
                      'Partner with Us to Shape the Future of Space Nutrition',
                      textAlign: TextAlign.center,
                      style: MainTheme.headerText,
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.symmetric(
                        horizontal: horizontalPadding, vertical: 10.0),
                    child: Text(
                      'We\'re looking for visionary partners to bring fresh cooking technology into space. If you\'re part of a space agency, research institution, or commercial venture, we want to hear from you and explore how we can collaborate to make space missions healthier and more sustainable.',
                      textAlign: TextAlign.center,
                      style: MainTheme.bodyText,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 200),
                    child: TextButton(
                      onPressed: () {
                        context.read<NavigationProvider>().updateIndex(5);
                      },
                      style: ButtonStyle(
                        backgroundColor:
                            MaterialStateProperty.resolveWith<Color>(
                          (states) {
                            if (states.contains(MaterialState.hovered)) {
                              return Colors.white;
                            }
                            return Colors.black;
                          },
                        ),
                        foregroundColor:
                            MaterialStateProperty.resolveWith<Color>(
                          (states) {
                            if (states.contains(MaterialState.hovered)) {
                              return Colors.black;
                            }
                            return Colors.white;
                          },
                        ),
                        padding: MaterialStateProperty.all<EdgeInsets>(
                          const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 12),
                        ),
                        shape: MaterialStateProperty.all<RoundedRectangleBorder>(
                          RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30.0),
                            side: const BorderSide(
                              color: Colors.white,
                              width: 2.0,
                            ),
                          ),
                        ),
                      ),
                      child: const Text('Get in Touch'),
                    ),
                  ),
                  // Extra space for scrolling
                  SizedBox(height: extraBottomSpace),
                ],
              ),
            ),
          ),
          NavBar(
            isTransparent: _isAtTop,
            color: Colors.black,
          ),
        ],
      ),
    );
  }
}