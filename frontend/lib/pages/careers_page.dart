import 'package:flutter/material.dart';
import 'package:frontend/providers/navigation_provider.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:frontend/widgets/footer.dart';
import 'package:frontend/widgets/job_posting.dart';
import 'package:frontend/widgets/navigation_bar.dart';
import 'package:provider/provider.dart';

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
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          SingleChildScrollView(
            controller: _scrollController,
            child: Padding(
              padding: const EdgeInsets.only(top: 120.0),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          "Join Us in Shaping\nthe Future",
                          textAlign: TextAlign.right,
                          style: TextStyle(fontSize: 32),
                        ),
                        SizedBox(
                          width: 10, // Adjust as needed.
                        ),
                        SizedBox(
                          height: 100, // Adjust as needed.
                          child: const VerticalDivider(
                            color: Colors.black,
                            thickness: 2,
                          ),
                        ),
                        SizedBox(
                          width: 10, // Adjust as needed.
                        ),
                        Text(
                          textAlign: TextAlign.left,
                          'At GI Healthcare, we’re always on\nthe lookout for top talent across all fields.\nIf you\'re passionate about innovation and\nexcellence, we’d love to hear from you.',
                        ),
                      ],
                    ),
                    SizedBox(
                      height: 80, // Adjust as needed.
                    ),
                    const Text(
                      "Where are we?",
                      style: TextStyle(fontSize: 32),
                    ),
                    const SizedBox(
                      height: 20, // Adjust as needed.
                    ),
                    Container(
                      decoration: BoxDecoration(
                      boxShadow: [
                        BoxShadow(
                        color: Colors.grey.withOpacity(0.5),
                        spreadRadius: 5,
                        blurRadius: 7,
                        offset: const Offset(0, 3),
                        ),
                      ],
                      ),
                      child: Image.asset(
                      'assets/images/robo_tile.webp',
                      width: MediaQuery.of(context).size.width * 2 / 3,
                      fit: BoxFit.contain,
                      ),
                    ),
                    const SizedBox(
                      height: 20, // Adjust as needed.
                    ),
                    SizedBox(
                      width: MediaQuery.of(context).size.width * 0.5,
                      child: const Text(
                        "Based in Edinburgh, our R&D office is the centre of innovation, driving research and development efforts. Here, our teams focus on pioneering new technologies and solutions that push the boundaries of healthcare excellence.",
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 16),
                      ),
                    ),
                    const SizedBox(height: 60),
                    const Text(
                      "Current Openings",
                      style: TextStyle(fontSize: 32),
                    ),
                    const SizedBox(height: 20),
                    Column(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        JobPosting(
                            title: "Technician Intern",
                            location: "Edinburgh",
                            jobType: "Internship",
                            description:
                                "Join our team to maintain and repair complex systems."),
                        JobPosting(
                            title: "Junior Software Developer",
                            location: "Edinburgh",
                            jobType: "Internship",
                            description:
                                "Join our team to develop innovative software solutions."),


                        SizedBox(
                          height: 50, 
                        ),
                        Text('if you are interested in any of the above positions, please send your CV and cover letter to careers@gihealthcare.co.uk')

                      ],
                    ),
                    const SizedBox(height: 60),
                    Footer(),
                  ],
                ),
              ),
            ),
          ),
          const NavBar(
            isTransparent: false,
            color: MainTheme.giRed,
          ),
        ],
      ),
    );
  }
}
