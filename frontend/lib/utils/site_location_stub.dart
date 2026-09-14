void initializeNavigation() {}
Uri currentLocation() => Uri.base;
Stream<Uri> get locationChanges => const Stream<Uri>.empty();
void writeLocation(Uri uri) {}
