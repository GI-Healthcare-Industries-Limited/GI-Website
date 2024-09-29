import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:frontend/widgets/navigation_bar.dart';
import 'package:frontend/widgets/space_text_image.dart';

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
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          SingleChildScrollView(
            controller: _scrollController,
            child: Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 100),
                    child: SpaceTextImage(
                      text:
                          'Astronauts currently have limited food options in space, relying primarily on prepackaged, processed meals and a few raw vegetables. While these meals are carefully designed to meet nutritional needs, the lack of variety and freshness can make it challenging to maintain a balanced diet over long missions. This limited food selection can also impact astronauts\' overall health and morale. With no ability to cook or prepare fresh food in space, staying healthy over extended periods becomes increasingly difficult, highlighting the need for innovative solutions to expand their food options.',
                      imagePath: 'assets/images/astronauts.webp',
                      imageFirst: true,
                    ),
                  ),
                  SpaceTextImage(
                      text:
                          'Recent advancements in growing vegetables in space offer an exciting opportunity to improve astronauts\' diets. NASA and other space agencies have successfully cultivated crops like lettuce, radishes, and even peppers on the International Space Station, providing a valuable source of fresh, nutritious food. While this is a significant step forward, the lack of cooking facilities in space means astronauts are still limited to raw produce. This is where our company sees tremendous potential. We are dedicated to expanding our fresh cooking technology into space, overcoming the challenges of a zero-gravity environment, and bringing freshly prepared meals to astronauts, ultimately enhancing their health and well-being on long missions.',
                      imagePath: 'assets/images/space_garden.webp',
                      imageFirst: false)
                ],
              ),
            ),
          ),
          const NavBar(isTransparent: true),
        ],
      ),
    );
  }
}
