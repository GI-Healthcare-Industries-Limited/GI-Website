import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:frontend/widgets/background_video_page.dart';
import 'package:frontend/widgets/footer.dart';
import 'package:frontend/widgets/machine_map_section.dart';
import 'package:frontend/widgets/navigation_bar.dart';
import 'package:frontend/widgets/problem_section.dart';
import 'package:frontend/widgets/solution_section.dart';
import 'package:frontend/widgets/supporters.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final ScrollController _scrollController = ScrollController();
  bool _isAtTop = true;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  //controlling _isAtTop variable for navbar
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
    final bool isMobile = screenWidth < 1000;

    return Scaffold(
      body: Stack(
        children: [
          SingleChildScrollView(
            controller: _scrollController,
            child: Container(
              color: Colors.white,
              child: Column(
                children: [
                  AspectRatio(
                    aspectRatio: 16 / 9,
                    child: BackgroundVideoPage(),
                  ),
                  const ProblemSection(),
                  isMobile
                      ? Image.asset('assets/images/arrow.webp')
                      : Image.asset(
                          'assets/images/arrows.webp',
                          width: screenWidth - 200,
                        ),
                  const SolutionSection(),
                  const MachineMapSection(),
                  const Supporters(),
                  Footer(),
                ],
              ),
            ),
          ),
          NavBar(isTransparent: _isAtTop, color: MainTheme.giRed,),
        ],
      ),
    );
  }

  Widget buildStepScroll(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final bool isMobile = screenWidth < 1000;

    return Scaffold(
      body: Stack(
        children: [
          PageView(
            children: [
              AspectRatio(
                aspectRatio: 16 / 9,
                child: BackgroundVideoPage(),
              ),
              const ProblemSection(),
              isMobile
                  ? Image.asset('assets/images/arrow.webp')
                  : Image.asset(
                      'assets/images/arrows.webp',
                      width: screenWidth - 200,
                    ),
              const SolutionSection(),
              const MachineMapSection(),
              const Supporters(),
              Footer(),
            ],
          ),
          NavBar(isTransparent: _isAtTop, color: MainTheme.giRed,),
        ],
      ),
    );
  }
}
