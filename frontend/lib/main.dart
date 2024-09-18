import 'package:flutter/material.dart';
import 'package:frontend/utils/web_scroll_behaviour.dart';
import 'package:provider/provider.dart';
import 'providers/navigation_provider.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => NavigationProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      scrollBehavior: WebScrollBehavior(),
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
