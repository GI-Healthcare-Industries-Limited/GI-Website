import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:frontend/utils/animated_counter.dart';

class ProblemSection extends StatelessWidget {
  const ProblemSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.fromLTRB(60, 40, 60, 60),
              child: Container(
                padding: const EdgeInsets.fromLTRB(60, 40, 60, 60),
                decoration: MainTheme.tileDecoration,
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Over-Consumption', style: MainTheme.problemText),
                    Text(
                        'The global ultra-processed food crisis is leading to widespread obesity, chronic diseases, and significant economic burdens, impacting billions of lives worldwide.'),
                    AnimatedCounter(
                      targetNumber: 2000000000000,
                      money: true,
                      percentage: false,
                      key: Key('counter1'),
                    ),
                    Text('The global economic burden of diet-related disease'),
                    AnimatedCounter(
                      targetNumber: 650000000,
                      money: false,
                      percentage: false,
                      key: Key('counter2'),
                    ),
                    Text('The global number of adults classified as obese'),
                    AnimatedCounter(
                      targetNumber: 11000000,
                      money: false,
                      percentage: false,
                      key: Key('counter3'),
                    ),
                    Text('The global number of deaths related to poor diets')
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: Container(
              padding: const EdgeInsets.fromLTRB(60, 40, 60, 60),
              child: Container(
                padding: const EdgeInsets.fromLTRB(60, 40, 60, 60),
                decoration: MainTheme.tileDecoration,
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Labour Shortage', style: MainTheme.problemText),
                    Text(
                        'The labour shortage of chefs, especially in the military, means increasing demand for skilled personnel leading to operational strain in providing food services for military personnel globally.'),
                    AnimatedCounter(
                      targetNumber: 30000,
                      money: false,
                      percentage: false,
                      key: Key('counter4'),
                    ),
                    Text('The shortage in chefs in the UK hospitality sector'),
                    AnimatedCounter(
                      targetNumber: 1200,
                      money: false,
                      percentage: false,
                      key: Key('counter5'),
                    ),
                    Text('The shortage in chefs in the UK military'),
                    AnimatedCounter(
                      targetNumber: 150000,
                      money: false,
                      percentage: false,
                      key: Key('counter6'),
                    ),
                    Text(
                        'The number of troops with reduced meal quality due to lack of chefs')
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: Container(
              padding: const EdgeInsets.fromLTRB(60, 40, 60, 60),
              child: Container(
                padding: const EdgeInsets.fromLTRB(60, 40, 60, 60),
                decoration: MainTheme.tileDecoration,
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Price Increase', style: MainTheme.problemText),
                    Text(
                        'The price of healthy foods has been rising rapidly, outpacing inflation and making nutritious options increasingly unaffordable. This affects food affordability and accessibility.'),
                    AnimatedCounter(
                      targetNumber: 3000000000,
                      money: false,
                      percentage: false,
                      key: Key('counter7'),
                    ),
                    Text(
                        'The global number of people who cannot afford a healthy diet'),
                    AnimatedCounter(
                      targetNumber: 120,
                      money: false,
                      percentage: true,
                      key: Key('counter8'),
                    ),
                    Text('The price increase of healthy foods in the last decade'),
                    AnimatedCounter(
                      targetNumber: 60,
                      money: false,
                      percentage: true,
                      key: Key('counter9'),
                    ),
                    Text('Healthy foods are 60% more expensive on average than UPFs')
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
