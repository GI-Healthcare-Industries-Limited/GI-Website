import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:frontend/widgets/careers_location_video.dart';
import 'package:frontend/utils/helpers.dart';
import 'package:frontend/widgets/footer.dart';
import 'package:frontend/widgets/job_posting.dart';
import 'package:frontend/widgets/navigation_bar.dart';

class CareersPage extends StatefulWidget {
  const CareersPage({super.key});

  @override
  _CareersPageState createState() => _CareersPageState();
}

class _CareersPageState extends State<CareersPage> {
  final ScrollController _scrollController = ScrollController();
  bool _isAtTop = true;
  List<Map<String, dynamic>>? _openings;
  bool _loading = false;
  bool _failed = false;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadOpenings();
    _refreshTimer =
        Timer.periodic(const Duration(seconds: 60), (_) => _loadOpenings());
  }

  Future<void> _loadOpenings() async {
    if (_loading) return;
    setState(() => _loading = true);
    try {
      final response = await http.get(Uri.base.resolve('/api/careers/openings'),
          headers: {
            'Cache-Control': 'no-cache'
          }).timeout(const Duration(seconds: 10));
      if (response.statusCode != 200)
        throw const FormatException('Unavailable');
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final items = (body['items'] as List)
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
      if (items.any((item) =>
          item['id'] is! String ||
          item['job_title'] is! String ||
          item['is_open'] is! bool)) {
        throw const FormatException('Invalid openings');
      }
      if (mounted)
        setState(() {
          _openings = items;
          _failed = false;
        });
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
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
    _refreshTimer?.cancel();
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
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 24),
                      child: Wrap(
                        alignment: WrapAlignment.center,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 32,
                        runSpacing: 24,
                        children: [
                          SizedBox(
                              width: 300,
                              child: Text('Join Us in Shaping\nthe Future',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 32))),
                          SizedBox(
                              width: 320,
                              child: Text(
                                  'At GI Healthcare, we’re always on the lookout for top talent across all fields. If you’re passionate about innovation and excellence, we’d love to hear from you.',
                                  textAlign: TextAlign.center)),
                        ],
                      ),
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
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 1000),
                        child: const CareersLocationVideo(),
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
                    if (_failed)
                      Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(children: [
                            const Text(
                                'We cannot load job postings right now. Please try again shortly.',
                                textAlign: TextAlign.center),
                            TextButton(
                                onPressed: _loading ? null : _loadOpenings,
                                child:
                                    Text(_loading ? 'Checking…' : 'Try again')),
                          ]))
                    else if (_openings == null)
                      const Padding(
                          padding: EdgeInsets.all(24),
                          child: Text('Loading job postings…'))
                    else if (_openings!.isEmpty)
                      const Padding(
                          padding: EdgeInsets.all(24),
                          child: Text(
                              'No job postings at the moment. Please check back later.',
                              textAlign: TextAlign.center))
                    else
                      ..._openings!.map((job) => JobPosting(
                            key: ValueKey(job['id']),
                            id: job['id'],
                            title: job['job_title'],
                            location: job['location'],
                            jobType: job['employment_type'],
                            department: job['department'],
                            description: job['description'],
                            isOpen: job['is_open'],
                            closingDate: job['closing_date'],
                            extendedClosingDate: job['extended_closing_date'],
                            startDate: job['start_date'],
                          )),
                    Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(children: [
                          const Text(
                            'Select Apply to share your details. A portfolio or project link is optional.',
                            textAlign: TextAlign.center,
                          ),
                          TextButton(
                            onPressed: () => Helpers.SendToSameTab('/contact'),
                            child: const Text('Other questions? Contact us'),
                          ),
                        ])),
                    const SizedBox(height: 60),
                    Footer(),
                  ],
                ),
              ),
            ),
          ),
          const NavBar(),
        ],
      ),
    );
  }
}
