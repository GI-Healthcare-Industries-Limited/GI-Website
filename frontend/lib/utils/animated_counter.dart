import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:intl/intl.dart';
import 'package:visibility_detector/visibility_detector.dart';

class AnimatedCounter extends StatefulWidget {
  final int targetNumber;
  final bool money;
  final bool percentage;

  const AnimatedCounter({
    required this.targetNumber,
    Key? key,
    required this.money,
    required this.percentage,
  }) : super(key: key);

  @override
  _AnimatedCounterState createState() => _AnimatedCounterState();
}

class _AnimatedCounterState extends State<AnimatedCounter>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<int> _animation;
  bool _hasAnimated = false;
  final NumberFormat _numberFormat = NumberFormat.decimalPattern();

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    );

    _animation =
        IntTween(begin: 0, end: widget.targetNumber).animate(_controller)
          ..addListener(() {
            setState(() {});
          });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _startCounting() {
    if (!_hasAnimated) {
      _controller.forward();
      _hasAnimated = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    String output;
    widget.money
        ? output = '\$${_numberFormat.format(_animation.value)}'
        : widget.percentage
            ? output = '${_numberFormat.format(_animation.value)}%'
            : output = _numberFormat.format(_animation.value);

    return VisibilityDetector(
        key: widget.key!,
        onVisibilityChanged: (VisibilityInfo info) {
          if (info.visibleFraction > 0.5) {
            _startCounting();
          }
        },
        child: Text(
          output,
          style: MainTheme.numberText,
        ));
  }
}
