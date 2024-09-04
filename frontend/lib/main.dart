import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/navigation_provider.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => NavigationProvider()),
      ],
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GI Healthcare',
      home: Scaffold(
        body: Consumer<NavigationProvider>(
          builder: (context, navigationProvider, child) {
            return navigationProvider.currentPage;
          },
        ),
      ),
    );
  }
}
