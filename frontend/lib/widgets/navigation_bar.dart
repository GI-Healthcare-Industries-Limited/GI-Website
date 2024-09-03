import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';

class NavBar extends StatelessWidget{
  const NavBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: MainTheme.giRed,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          Image.asset('lib/assets/images/butterfly.png', height: 60,),
          const Text('Home', style: MainTheme.headerText,),
          const Text('About us', style: MainTheme.headerText,),
          const Text('Military', style: MainTheme.headerText,),
          const Text('Space', style: MainTheme.headerText,),
          const Text('Careers', style: MainTheme.headerText,),
          const Text('Contact us', style: MainTheme.headerText,),
        ],
      ),
    );
  }
}