import 'dart:async';
import 'package:flutter/material.dart';
import 'package:frontend/utils/motion_preferences.dart' as motion;
import 'package:video_player/video_player.dart';

/// Reuses the former Home banner film, without its title or call-to-action.
class CareersLocationVideo extends StatefulWidget {
  const CareersLocationVideo({super.key});

  @override
  State<CareersLocationVideo> createState() => _CareersLocationVideoState();
}

class _CareersLocationVideoState extends State<CareersLocationVideo> {
  late final VideoPlayerController _controller;
  bool _failed = false;
  bool _reduceMotion = false;
  StreamSubscription<bool>? _motionSubscription;

  @override
  void initState() {
    super.initState();
    _reduceMotion = motion.prefersReducedMotion;
    _controller = VideoPlayerController.asset('assets/videos/bg_video.mp4');
    _motionSubscription = motion.motionPreferenceChanges.listen((reduce) {
      if (!mounted) return;
      _reduceMotion = reduce || MediaQuery.disableAnimationsOf(context);
      if (_reduceMotion && _controller.value.isPlaying) _togglePlayback();
    });
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      await _controller.initialize().timeout(const Duration(seconds: 30));
      if (!mounted) return;
      await _controller.setVolume(0);
      await _controller.setLooping(true);
      if (mounted && !_reduceMotion) await _controller.play();
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _reduceMotion = motion.prefersReducedMotion || MediaQuery.disableAnimationsOf(context);
    if (_reduceMotion && _controller.value.isPlaying) _togglePlayback();
  }

  Future<void> _togglePlayback() async {
    try {
      if (_controller.value.isPlaying) {
        await _controller.pause();
      } else {
        await _controller.play();
      }
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  void dispose() {
    _motionSubscription?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<VideoPlayerValue>(
      valueListenable: _controller,
      builder: (context, value, _) {
        final unavailable = _failed || value.hasError;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: ColoredBox(
                  color: const Color(0xFF202621),
                  child: unavailable
                      ? const Center(child: Padding(
                          padding: EdgeInsets.all(24),
                          child: Text('Video unavailable. Please reload to try again.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Colors.white)),
                        ))
                      : value.isInitialized
                          ? Semantics(
                              label: 'The National Robotarium in Edinburgh',
                              child: Center(child: AspectRatio(
                                aspectRatio: value.aspectRatio,
                                child: VideoPlayer(_controller),
                              )),
                            )
                          : const Center(child: CircularProgressIndicator(
                              color: Colors.white,
                              semanticsLabel: 'Loading location video',
                            )),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(children: [
              const Expanded(child: Text('The National Robotarium, Edinburgh',
                  style: TextStyle(fontSize: 14, color: Color(0xFF62685F)))),
              if (value.isInitialized && !unavailable)
                TextButton.icon(
                  onPressed: _togglePlayback,
                  icon: Icon(value.isPlaying ? Icons.pause : Icons.play_arrow, size: 18),
                  label: Text(value.isPlaying ? 'Pause video' : 'Play video'),
                  style: TextButton.styleFrom(foregroundColor: const Color(0xFF30382D)),
                ),
            ]),
          ],
        );
      },
    );
  }
}
