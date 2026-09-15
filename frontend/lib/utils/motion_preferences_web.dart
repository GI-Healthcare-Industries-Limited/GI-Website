import 'dart:html' as html;

// Flutter 3.27 does not consistently expose this browser preference through
// MediaQuery.disableAnimations, so read it directly for the location film.
final _query = html.window.matchMedia('(prefers-reduced-motion: reduce)');
bool get prefersReducedMotion => _query.matches;
Stream<bool> get motionPreferenceChanges => _query.onChange.map((_) => _query.matches);
