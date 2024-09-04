import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:url_launcher/url_launcher.dart';
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
          Container(
            width: double.infinity,
            height: double.infinity,
            color: Colors.black.withOpacity(0.7),
          ),
          Center(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Row(children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(0, 0, 0, 0),
                    child: Image.asset(
                      'assets/images/white_butterfly.png',
                      height: 250,
                    ),
                  ),
                  const Text(
                    'GI Healthcare',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 48,
                    ),
                  ),
                ]),
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Row(
                      children: [
                        Image.asset(
                          'assets/images/divider.png',
                          width: 200,
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(8, 0, 8, 0),
                          child: Image.asset(
                            'assets/images/white_butterfly.png',
                            height: 30,
                          ),
                        ),
                        Image.asset(
                          'assets/images/divider.png',
                          width: 200,
                        ),
                      ],
                    ),
                    const Text(
                      'We develop new technologies that provide\nfreshly cooked healthy food to\nanyone, any time, anywhere.',
                      style: MainTheme.headerText,
                    ),
                    Row(
                      children: [
                        Image.asset(
                          'assets/images/divider.png',
                          width: 200,
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(8, 0, 8, 0),
                          child: Image.asset(
                            'assets/images/white_butterfly.png',
                            height: 30,
                          ),
                        ),
                        Image.asset(
                          'assets/images/divider.png',
                          width: 200,
                        ),
                      ],
                    )
                  ],
                )
              ],
            ),
          ),
        ],
      ),
    );
  }
}
