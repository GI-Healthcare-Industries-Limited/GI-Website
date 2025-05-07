import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class BackgroundVideoPage extends StatefulWidget {
  @override
  _BackgroundVideoPageState createState() => _BackgroundVideoPageState();
}

class _BackgroundVideoPageState extends State<BackgroundVideoPage> {
  late VideoPlayerController _controller;
  late Future<void> _initializeVideoPlayerFuture;

  @override
  void initState() {
    super.initState();

    _controller = VideoPlayerController.asset('assets/videos/bg_video.mp4');

    _initializeVideoPlayerFuture = _controller.initialize().then((_) {
      _controller.setVolume(0.0); // Mute the video
      _controller.play();
      _controller.setLooping(true); // Loop the video continuously
      setState(() {});
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Get the screen size
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 1100;

    return Scaffold(
      body: Stack(
        children: [
          FutureBuilder(
            future: _initializeVideoPlayerFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.done) {
                return Center(
                  child: AspectRatio(
                    aspectRatio: _controller.value.aspectRatio,
                    child: VideoPlayer(_controller),
                  ),
                );
              } else {
                return const Center(child: CircularProgressIndicator());
              }
            },
          ),
          // Semi-transparent overlay
          Container(
            width: double.infinity,
            height: double.infinity,
            color: Colors.black.withOpacity(0.7),
          ),
          Center(
            child: Padding(
              padding: const EdgeInsets.all(
                  16.0), // Added padding for responsiveness
              child: isMobile ? _buildMobileLayout() : _buildDesktopLayout(),
            ),
          ),
        ],
      ),
    );
  }

  // Mobile layout (stacked vertically)
  Widget _buildMobileLayout() {
    return const Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Column(
          children: [
            Text(
              'GI Healthcare',
              style: TextStyle(
                color: Colors.white,
                fontSize: 36,
              ),
            ),
          ],
        ),
        SizedBox(height: 30),
        SizedBox(height: 20),
        Text(
          'On a mission to develop advanced food tech products\nto make freshly cooked healthy food easily accessible and\naffordable to anyone, anytime, anywhere\n(beyond planet Earth!) ',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white,
            fontSize: 18, // Smaller text for mobile
          ),
        ),
        SizedBox(height: 20),
      ],
    );
  }

  // Desktop layout (horizontal row layout)
  Widget _buildDesktopLayout() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        // Butterfly image and title on the left
        Row(
          children: [
            Image.asset(
              'assets/images/white_butterfly.webp',
              height: 250,
            ),
            const SizedBox(width: 16),
            const Text(
              'GI Healthcare',
              style: TextStyle(
                color: Colors.white,
                fontSize: 48,
              ),
            ),
          ],
        ),
        // Divider, text, and another divider on the right
        Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildDividerSection(),
            const SizedBox(height: 20),
            const Text(
              'On a mission to develop advanced food tech\nproducts to make freshly cooked healthy food easily\naccessible and affordable to anyone,\nanytime, anywhere (beyond planet Earth!) ',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
              ),
            ),
            const SizedBox(height: 20),
            _buildDividerSection(),
          ],
        )
      ],
    );
  }

  // Divider and butterfly row
  Widget _buildDividerSection() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Image.asset(
          'assets/images/divider.webp',
          width: 100,
        ),
        const SizedBox(width: 8),
        Image.asset(
          'assets/images/white_butterfly.webp',
          height: 30,
        ),
        const SizedBox(width: 8),
        Image.asset(
          'assets/images/divider.webp',
          width: 100,
        ),
      ],
    );
  }
}
