import 'package:flutter/material.dart';
import 'package:frontend/themes/main_theme.dart';
import 'package:frontend/utils/animated_counter.dart';

class ProblemSection extends StatelessWidget {
  const ProblemSection({super.key});

  @override
  Widget build(BuildContext context) {
    // Get screen width
    final screenWidth = MediaQuery.of(context).size.width;
    final bool isMobile = screenWidth < 1000; // Consider screens less than 600px as mobile

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16.0), // Add padding for mobile responsiveness
      child: isMobile ? _buildMobileLayout() : _buildDesktopLayout(),
    );
  }

  // Desktop layout with three columns
  Widget _buildDesktopLayout() {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(child: _buildProblemTile('Over-Consumption', _buildOverConsumptionContent())),
          Expanded(child: _buildProblemTile('Labour Shortage', _buildLabourShortageContent())),
          Expanded(child: _buildProblemTile('Price Increase', _buildPriceIncreaseContent())),
        ],
      ),
    );
  }

  // Mobile layout with one column (stacked vertically)
  Widget _buildMobileLayout() {
    return Column(
      children: [
        _buildProblemTile('Over-Consumption', _buildOverConsumptionContent()),
        const SizedBox(height: 16), // Add some spacing between tiles for better readability
        _buildProblemTile('Labour Shortage', _buildLabourShortageContent()),
        const SizedBox(height: 16),
        _buildProblemTile('Price Increase', _buildPriceIncreaseContent()),
      ],
    );
  }

  // Widget to build each problem tile
  Widget _buildProblemTile(String title, Widget content) {
    return Container(
      margin: const EdgeInsets.all(16.0),
      padding: const EdgeInsets.all(32.0),
      decoration: MainTheme.tileDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: MainTheme.problemText),
          const SizedBox(height: 16),
          content,
        ],
      ),
    );
  }

  // Over-Consumption content
  Widget _buildOverConsumptionContent() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
            'The global ultra-processed food crisis is leading to widespread obesity, chronic diseases, and significant economic burdens, impacting billions of lives worldwide.'),
        SizedBox(height: 8),
        AnimatedCounter(
          targetNumber: 2000000000000,
          money: true,
          percentage: false,
          key: Key('counter1'),
        ),
        Text('The global economic burden of diet-related disease'),
        SizedBox(height: 8),
        AnimatedCounter(
          targetNumber: 650000000,
          money: false,
          percentage: false,
          key: Key('counter2'),
        ),
        Text('The global number of adults classified as obese'),
        SizedBox(height: 8),
        AnimatedCounter(
          targetNumber: 11000000,
          money: false,
          percentage: false,
          key: Key('counter3'),
        ),
        Text('The global number of deaths related to poor diets'),
      ],
    );
  }

  // Labour Shortage content
  Widget _buildLabourShortageContent() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
            'The labour shortage of chefs, especially in the military, means increasing demand for skilled personnel leading to operational strain in providing food services for military personnel globally.'),
        SizedBox(height: 8),
        AnimatedCounter(
          targetNumber: 30000,
          money: false,
          percentage: false,
          key: Key('counter4'),
        ),
        Text('The shortage in chefs in the UK hospitality sector'),
        SizedBox(height: 8),
        AnimatedCounter(
          targetNumber: 1200,
          money: false,
          percentage: false,
          key: Key('counter5'),
        ),
        Text('The shortage in chefs in the UK military'),
        SizedBox(height: 8),
        AnimatedCounter(
          targetNumber: 150000,
          money: false,
          percentage: false,
          key: Key('counter6'),
        ),
        Text('The number of troops with reduced meal quality due to lack of chefs'),
      ],
    );
  }

  // Price Increase content
  Widget _buildPriceIncreaseContent() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
            'The price of healthy foods has been rising rapidly, outpacing inflation and making nutritious options increasingly unaffordable. This affects food affordability and accessibility.'),
        SizedBox(height: 8),
        AnimatedCounter(
          targetNumber: 3000000000,
          money: false,
          percentage: false,
          key: Key('counter7'),
        ),
        Text('The global number of people who cannot afford a healthy diet'),
        SizedBox(height: 8),
        AnimatedCounter(
          targetNumber: 120,
          money: false,
          percentage: true,
          key: Key('counter8'),
        ),
        Text('The price increase of healthy foods in the last decade'),
        SizedBox(height: 8),
        AnimatedCounter(
          targetNumber: 60,
          money: false,
          percentage: true,
          key: Key('counter9'),
        ),
        Text('Healthy foods are 60% more expensive on average than UPFs'),
      ],
    );
  }
}
