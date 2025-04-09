import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:frontend/widgets/navigation_bar.dart';

class MilitaryPage extends StatelessWidget {
  const MilitaryPage({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;

    return Scaffold(
      backgroundColor: const Color(0xFF252625),
      body: Stack(
        children: [
          Center(  
            child: Padding(
              padding: EdgeInsets.symmetric(
                horizontal: getHorizontalPadding(screenWidth),
                vertical: 100,  
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center, 
                  children: [
                    Image.asset('assets/images/mod_small.webp', height: 200),
                    const SizedBox(height: 20),
                    const Text(
                      'For Access to our military portal,\nplease verify a valid mod.uk address using the box below.',
                      textAlign: TextAlign.center,
                      style: MainTheme.bodyText,
                    ),
                    const SizedBox(height: 20),
                    Container(
                      width: 400,
                      child: TextField(
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: 'Enter mod.uk address',
                          hintStyle: TextStyle(color: Colors.grey[600]),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, 
                            vertical: 12,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Colors.white,
                              width: 2.0,
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Colors.white,
                              width: 2.0,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Colors.white,
                              width: 2.0,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    TextButton(
                      onPressed: () {},
                      style: ButtonStyle(
                        backgroundColor: WidgetStateProperty.resolveWith<Color>(
                          (states) {
                            if (states.contains(WidgetState.hovered)) {
                              return const Color(0xFF252625);
                            }
                            return Colors.white;
                          },
                        ),
                        foregroundColor: WidgetStateProperty.resolveWith<Color>(
                          (states) {
                            if (states.contains(WidgetState.hovered)) {
                              return Colors.white;
                            }
                            return Colors.black;
                          },
                        ),
                        padding: WidgetStateProperty.all<EdgeInsets>(
                          const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        ),
                        shape: WidgetStateProperty.all<RoundedRectangleBorder>(
                          RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30.0),
                          ),
                        ),
                      ),
                      child: const Text('Enter'),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const NavBar(isTransparent: true, color: Color(0xFF252625),),
        ],
      ),
    );
  }

  // Function to determine horizontal padding based on screen width
  double getHorizontalPadding(double screenWidth) {
    if (screenWidth > 1200) {
      return 500; // Large screens (desktop)
    } else if (screenWidth > 800) {
      return 200; // Medium screens (tablet)
    } else {
      return 40;  // Small screens (mobile)
    }
  }
}
