import 'package:flutter/material.dart';

class SpaceBackdrop extends StatelessWidget {
  final double scrollOffset;

  SpaceBackdrop({required this.scrollOffset});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height + 2000,
      child: Stack(
        children: [
          Positioned(
            top: 165 - scrollOffset * 0.1,
            left: 0,
            child: Image.asset(
              "assets/images/earth.webp",
              height: 400,
            ),
          ),
          Positioned(
            top: 223 - scrollOffset * 0.4,
            right: 0,
            child: Image.asset(
              "assets/images/mars.webp",
              height: 300,
            ),
          ),
          Positioned(
            top: 600 - scrollOffset * 0.3, 
            right: 0,
            child: Image.asset(
              "assets/images/moon.webp",
              height: 300,
            ),
          ),
          Positioned(
            top: 900 - scrollOffset * 0.2,
            left: 0,
            child: Image.asset(
              "assets/images/neptune.webp",
              height: 500,
            ),
          ),
          Positioned(
            top: 1000 - scrollOffset * 0.2,
            right: 0,
            child: Image.asset(
              "assets/images/mercury.webp",
              height: 500,
            ),
          ),
        ],
      ),
    );
  }
}

        // Column(
        //   children: [
        //     Row(
        //       mainAxisAlignment: MainAxisAlignment.spaceBetween,
        //       crossAxisAlignment: CrossAxisAlignment.end,
        //       children: [
        //         Image.asset("assets/images/earth.webp", height: 400,),
        //         Image.asset("assets/images/mars.webp", height: 300,),
        //       ],
        //     ),
        //     Row(
        //       mainAxisAlignment: MainAxisAlignment.spaceBetween,
        //       crossAxisAlignment: CrossAxisAlignment.start,
        //       children: [
        //         Image.asset("assets/images/neptune.webp", height: 500,),
        //         Image.asset("assets/images/moon.webp", height: 200,)
        //       ],
        //     )
        //   ],
        // ),