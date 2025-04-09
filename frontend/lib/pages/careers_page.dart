import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:frontend/widgets/navigation_bar.dart';

class CareersPage extends StatefulWidget {
  const CareersPage({super.key});

  @override
  _CareersPageState createState() => _CareersPageState();
}

class _CareersPageState extends State<CareersPage> {
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
      body: Stack(
        children: [
          SingleChildScrollView(
            controller: _scrollController,
            child: const Center(
              child: Text('Careers content coming soon', style: MainTheme.problemText,),
            ),
          ),
          const NavBar(isTransparent: false, color: MainTheme.giRed,),
        ],
      ),
    );
  }
}
