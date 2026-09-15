const sitePageNames = ['home', 'space', 'careers'];

int pageIndexFromLocation(Uri uri) {
  final index = sitePageNames.indexOf(uri.queryParameters['page'] ?? 'home');
  return index < 0 ? 0 : index;
}

Uri locationForPage(Uri current, int index) {
  final parameters = Map<String, String>.from(current.queryParameters);
  if (index == 0) {
    parameters.remove('page');
  } else {
    parameters['page'] = sitePageNames[index];
  }
  return Uri(scheme: current.scheme, host: current.host,
      port: current.hasPort ? current.port : null, path: '/',
      queryParameters: parameters.isEmpty ? null : parameters);
}
