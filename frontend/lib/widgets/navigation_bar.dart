import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:frontend/providers/navigation_provider.dart';

// Matches the public Contact header; the application/admin keep their own shell.
class NavBar extends StatefulWidget {
  const NavBar({super.key});

  @override
  State<NavBar> createState() => _NavBarState();
}

class _NavBarState extends State<NavBar> {
  static const red = Color(0xFFE82127);
  static const labels = ['Home', 'Research', 'Careers', 'Contact us'];
  bool menuOpen = false;
  final menuFocus = FocusNode();

  @override
  void dispose() { menuFocus.dispose(); super.dispose(); }

  void navigate(int index) {
    setState(() => menuOpen = false);
    context.read<NavigationProvider>().updateIndex(index);
  }

  Widget navLink(int index, double fontSize, {bool mobile = false}) {
    final active = context.watch<NavigationProvider>().currentIndex == index;
    return Semantics(
      selected: active,
      child: TextButton(
        onPressed: () => navigate(index),
        style: TextButton.styleFrom(
          foregroundColor: Colors.white,
          alignment: Alignment.centerLeft,
          minimumSize: Size(0, mobile ? 46 : 44),
          padding: EdgeInsets.symmetric(vertical: mobile ? 13 : 12),
          shape: const RoundedRectangleBorder(),
          textStyle: TextStyle(fontFamily: 'Inter', fontSize: fontSize, fontWeight: FontWeight.w400),
        ),
        child: DecoratedBox(
          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: active ? Colors.white : Colors.transparent))),
          child: Padding(padding: const EdgeInsets.only(bottom: 5), child: Text(labels[index])),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final mobile = width <= 760;
    final compact = width <= 960;
    final gap = compact ? 18.0 : (width * .025).clamp(18.0, 40.0);
    return Align(
      alignment: Alignment.topCenter,
      heightFactor: 1,
      child: CallbackShortcuts(
        bindings: {const SingleActivator(LogicalKeyboardKey.escape): () {
          if (menuOpen) { setState(() => menuOpen = false); menuFocus.requestFocus(); }
        }},
        child: Material(
          color: red,
          elevation: menuOpen && mobile ? 5 : 0,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Center(child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1320),
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: compact ? 24 : 40),
                child: SizedBox(height: mobile ? 68 : 76, child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Semantics(container: true, label: 'GI Healthcare home', button: true, child: InkWell(
                      onTap: () => navigate(0),
                      // Reuse Contact's colour-normalised logo. The source PNG
                      // has a monitor ICC profile that Safari/CanvasKit can
                      // interpret differently from the flat header colour.
                      child: ExcludeSemantics(child: Image.asset('assets/images/gi-healthcare-header-logo.webp', width: compact ? 155 : 180)),
                    )),
                    if (mobile) TextButton(
                      focusNode: menuFocus,
                      onPressed: () { setState(() => menuOpen = !menuOpen); menuFocus.requestFocus(); },
                      style: TextButton.styleFrom(foregroundColor: Colors.white, padding: const EdgeInsets.only(left: 12), minimumSize: const Size(0, 44)),
                      child: Semantics(expanded: menuOpen, child: const Row(children: [
                        Icon(Icons.menu, size: 17), SizedBox(width: 5),
                        Text('Menu', style: TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.w400)),
                      ])),
                    ) else Row(children: [
                      for (var index = 0; index < labels.length; index++) ...[
                        if (index > 0) SizedBox(width: gap),
                        navLink(index, compact ? 12 : 14),
                      ],
                    ]),
                  ],
                )),
              ),
            )),
            if (mobile && menuOpen) Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(24, 12, 24, 20),
              decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color(0x40FFFFFF)))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                for (var index = 0; index < labels.length; index++) navLink(index, 15, mobile: true),
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}
