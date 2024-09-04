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
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: Scaffold(
        body: Consumer<NavigationProvider>(
          builder: (context, navigationProvider, child) {
            return navigationProvider.currentPage;
          },
        ),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: context.watch<NavigationProvider>().currentIndex,
          onTap: (index) {
            context.read<NavigationProvider>().updateIndex(index);
          },
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.info), label: 'About'),
            BottomNavigationBarItem(icon: Icon(Icons.business), label: 'Services'),
            BottomNavigationBarItem(icon: Icon(Icons.contact_mail), label: 'Contact'),
            BottomNavigationBarItem(icon: Icon(Icons.article), label: 'Blog'),
          ],
        ),
      ),
    );
  }
}