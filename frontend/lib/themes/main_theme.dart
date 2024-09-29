import 'package:flutter/material.dart';

class MainTheme {
  static const Color giRed = Color(0xFFE82127);

  static const TextStyle headerText =
      TextStyle(color: Colors.white, fontSize: 22);

  static const TextStyle smallPrint =
      TextStyle(color: Colors.white, fontSize: 10);

  static const TextStyle bodyText = 
       TextStyle(color: Colors.white, fontSize: 14);

  static const TextStyle linkText = TextStyle(
      color: Colors.white,
      fontSize: 14,);

  static const TextStyle numberText = TextStyle(
    color: giRed,
    fontSize: 36,
    fontWeight: FontWeight.bold,
  );

  static const TextStyle problemText = TextStyle(
    color: giRed,
    fontSize: 28,
  );

  static const TextStyle quoteText = TextStyle(
    color: Colors.white,
    fontSize: 28
  );

  static BoxDecoration tileDecoration = BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(12),
    boxShadow: [BoxShadow(
      color: Colors.black.withOpacity(0.1),
      blurRadius: 10,
      spreadRadius: 2,
      offset: const Offset(0,1),
    )]
  );
}
