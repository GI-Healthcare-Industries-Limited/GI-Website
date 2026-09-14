import 'dart:html' as html;
import 'package:flutter_web_plugins/flutter_web_plugins.dart';

// This site uses the provider's public-page history, not Navigator routes.
// Disable Flutter's extra "origin/flutter" entries so Back/Forward stay native.
void initializeNavigation() => setUrlStrategy(null);
Uri currentLocation() => Uri.parse(html.window.location.href);
Stream<Uri> get locationChanges => html.window.onPopState.map((_) => currentLocation());
void writeLocation(Uri uri) => html.window.history.pushState(null, '', uri.toString());
