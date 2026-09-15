import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:video_player_platform_interface/video_player_platform_interface.dart';
import 'package:frontend/widgets/careers_location_video.dart';

class FakeVideoPlatform extends VideoPlayerPlatform {
  final events = StreamController<VideoEvent>.broadcast();
  bool fail = false;
  bool played = false;
  bool disposed = false;
  bool loop = false;
  double volume = 1;
  String? asset;

  @override
  Future<void> init() async {}
  @override
  Future<int?> create(DataSource source) async {
    asset = source.asset;
    if (fail) throw PlatformException(code: 'video-unavailable');
    return 1;
  }
  @override
  Stream<VideoEvent> videoEventsFor(int id) {
    scheduleMicrotask(() => events.add(VideoEvent(
      eventType: VideoEventType.initialized,
      duration: const Duration(seconds: 60), size: const Size(1920, 1080),
    )));
    return events.stream;
  }
  @override
  Future<void> dispose(int id) async { disposed = true; }
  @override
  Future<void> setLooping(int id, bool value) async { loop = value; }
  @override
  Future<void> play(int id) async { played = true; }
  @override
  Future<void> pause(int id) async { played = false; }
  @override
  Future<void> setVolume(int id, double value) async { volume = value; }
  @override
  Future<void> setPlaybackSpeed(int id, double speed) async {}
  @override
  Future<Duration> getPosition(int id) async => Duration.zero;
  @override
  Widget buildView(int id) => const SizedBox.expand(key: Key('video-frame'));
}

void main() {
  late FakeVideoPlatform platform;
  setUp(() {
    platform = FakeVideoPlatform();
    VideoPlayerPlatform.instance = platform;
  });
  tearDown(() async { await platform.events.close(); });

  Future<void> mount(WidgetTester tester, {bool reducedMotion = false}) async {
    await tester.pumpWidget(MaterialApp(home: MediaQuery(
      data: MediaQueryData(disableAnimations: reducedMotion),
      child: const Scaffold(body: Center(child: SizedBox(width: 500, child: CareersLocationVideo()))),
    )));
    await tester.pump();
    await tester.pump();
  }

  testWidgets('reuses the exact film muted and looping with play/pause, then disposes it', (tester) async {
    await mount(tester);
    expect(platform.asset, 'assets/videos/bg_video.mp4');
    expect(platform.volume, 0);
    expect(platform.loop, true);
    expect(platform.played, true);
    expect(find.text('The National Robotarium, Edinburgh'), findsOneWidget);
    expect(find.textContaining('View Position'), findsNothing);
    await tester.tap(find.text('Pause video'));
    await tester.pump();
    expect(platform.played, false);
    await tester.tap(find.text('Play video'));
    await tester.pump();
    expect(platform.played, true);
    await tester.pumpWidget(const SizedBox());
    await tester.runAsync(() async { await Future<void>.delayed(Duration.zero); });
    expect(platform.disposed, true);
    expect(tester.takeException(), isNull);
  });

  testWidgets('reduced motion waits for an explicit Play', (tester) async {
    await mount(tester, reducedMotion: true);
    expect(platform.played, false);
    await tester.tap(find.text('Play video'));
    await tester.pump();
    expect(platform.played, true);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('a failed video shows a contained fallback instead of breaking Careers', (tester) async {
    platform.fail = true;
    await mount(tester);
    expect(find.text('Video unavailable. Please reload to try again.'), findsOneWidget);
    expect(find.text('Play video'), findsNothing);
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox());
  });
}
