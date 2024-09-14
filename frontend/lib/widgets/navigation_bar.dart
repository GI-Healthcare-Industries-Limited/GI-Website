import 'package:flutter/material.dart';
import 'package:frontend/widgets/hamburger_button.dart';
import 'package:provider/provider.dart';
import 'package:frontend/providers/navigation_provider.dart';
import 'package:frontend/themes/main_theme.dart';

class NavBar extends StatelessWidget {
  final bool isTransparent;

  const NavBar({super.key, required this.isTransparent});

  @override
  Widget build(BuildContext context) {
    if (MediaQuery.of(context).size.width < 800) {
      return buildMobile(context);
    } else {
      return buildDesktop(context);
    }
  }

  Widget buildMobile(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 700),
      decoration: BoxDecoration(
        color: isTransparent ? Colors.transparent : MainTheme.giRed,
        border: const Border(bottom: BorderSide(color: Colors.white)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Image.asset(
              'assets/images/white_butterfly.png',
              height: 50,
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: const HamburgerButton(),
          )
        ],
      ),
    );
  }

  Widget buildDesktop(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 700),
      decoration: BoxDecoration(
        color: isTransparent ? Colors.transparent : MainTheme.giRed,
        border: const Border(bottom: BorderSide(color: Colors.white)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Image.asset(
              'assets/images/white_butterfly.png',
              height: 50,
            ),
          ),
          HoverUnderlineText(
            text: 'Home',
            onTap: () {
              context.read<NavigationProvider>().updateIndex(0);
            },
            style: MainTheme.bodyText,
          ),
          HoverUnderlineText(
            text: 'About us',
            onTap: () {
              context.read<NavigationProvider>().updateIndex(1);
            },
            style: MainTheme.bodyText,
          ),
          HoverUnderlineText(
            text: 'Military',
            onTap: () {
              context.read<NavigationProvider>().updateIndex(2);
            },
            style: MainTheme.bodyText,
          ),
          HoverUnderlineText(
            text: 'Space',
            onTap: () {
              context.read<NavigationProvider>().updateIndex(3);
            },
            style: MainTheme.bodyText,
          ),
          HoverUnderlineText(
            text: 'Careers',
            onTap: () {
              context.read<NavigationProvider>().updateIndex(4);
            },
            style: MainTheme.bodyText,
          ),
          HoverUnderlineText(
            text: 'Contact us',
            onTap: () {
              context.read<NavigationProvider>().updateIndex(5);
            },
            style: MainTheme.bodyText,
          ),
        ],
      ),
    );
  }
}

//TODO: extract
class HoverUnderlineText extends StatefulWidget {
  final String text;
  final VoidCallback onTap;
  final TextStyle style;

  const HoverUnderlineText({
    Key? key,
    required this.text,
    required this.onTap,
    required this.style,
  }) : super(key: key);

  @override
  _HoverUnderlineTextState createState() => _HoverUnderlineTextState();
}

class _HoverUnderlineTextState extends State<HoverUnderlineText> {
  bool _isHovering = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) {
        setState(() {
          _isHovering = true;
        });
      },
      onExit: (_) {
        setState(() {
          _isHovering = false;
        });
      },
      child: InkWell(
        onTap: widget.onTap,
        child: Text(
          '${widget.text} ${_isHovering ? '+' : '-'}',
          style: widget.style.copyWith(
            decoration:
                _isHovering ? TextDecoration.underline : TextDecoration.none,
            decorationColor: Colors.white,
            decorationThickness: 2,
          ),
        ),
      ),
    );
  }
}
