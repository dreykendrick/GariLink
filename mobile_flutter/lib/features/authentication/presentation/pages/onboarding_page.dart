import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../core/theme/radius.dart';
import '../../../../shared/widgets/app_button.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingItem> _items = [
    OnboardingItem(
      title: 'Find Cars\nAnywhere',
      subtitle: 'Rent nearby vehicles in minutes.',
      icon: Icons.map_outlined,
      visualPainter: OnboardingMapPainter(),
    ),
    OnboardingItem(
      title: 'Turn your vehicle\ninto income',
      subtitle: 'Rent your vehicle and start earning.',
      icon: Icons.monetization_on_outlined,
      visualPainter: OnboardingEarnPainter(),
    ),
    OnboardingItem(
      title: 'Know where your\nvehicle is',
      subtitle: 'Real-time location tracking.',
      icon: Icons.gps_fixed_outlined,
      visualPainter: OnboardingTrackPainter(),
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onNext() {
    if (_currentPage < _items.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      context.go('/welcome');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF070F1A) : GariLinkColors.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Top Bar with Skip button
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.all(GariLinkSpacing.lg),
                child: TextButton(
                  onPressed: () => context.go('/welcome'),
                  child: Text(
                    'Skip',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: GariLinkColors.textSecondary,
                    ),
                  ),
                ),
              ),
            ),

            // Sliding pages
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (val) {
                  setState(() {
                    _currentPage = val;
                  });
                },
                itemCount: _items.length,
                itemBuilder: (context, index) {
                  final item = _items[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: GariLinkSpacing.xxl),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Large Premium Vector Illustration Card
                        Container(
                          width: double.infinity,
                          height: 240,
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF0F1E33) : Colors.white,
                            borderRadius: BorderRadius.circular(GariLinkRadius.card),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x0A000000),
                                offset: Offset(0, 8),
                                blurRadius: 24,
                              )
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(GariLinkRadius.card),
                            child: CustomPaint(
                              painter: item.visualPainter,
                            ),
                          ),
                        ),
                        const SizedBox(height: GariLinkSpacing.xxxxl),
                        Text(
                          item.title,
                          style: GoogleFonts.inter(
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : GariLinkColors.textPrimary,
                            height: 1.2,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: GariLinkSpacing.md),
                        Text(
                          item.subtitle,
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            color: GariLinkColors.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),

            // Page indicators & Next button footer
            Padding(
              padding: const EdgeInsets.all(GariLinkSpacing.xxl),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _items.length,
                      (index) => AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: index == _currentPage ? 20 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: index == _currentPage
                              ? GariLinkColors.accent
                              : GariLinkColors.border,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: GariLinkSpacing.xl),
                  AppButton(
                    text: _currentPage == _items.length - 1 ? 'Get Started' : 'Next',
                    onPressed: _onNext,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class OnboardingItem {
  final String title;
  final String subtitle;
  final IconData icon;
  final CustomPainter visualPainter;

  OnboardingItem({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.visualPainter,
  });
}

// Vector painters mimicking premium maps, income stats, and live GPS trackers
class OnboardingMapPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final bgPaint = Paint()..color = GariLinkColors.accent.withOpacity(0.04);
    canvas.drawRect(Offset.zero & size, bgPaint);

    final linePaint = Paint()
      ..color = GariLinkColors.accent.withOpacity(0.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    // Draw stylized map grid lines
    for (int i = 0; i < size.width; i += 40) {
      canvas.drawLine(Offset(i.toDouble(), 0), Offset(i.toDouble() + 30, size.height), linePaint);
    }
    for (int j = 0; j < size.height; j += 40) {
      canvas.drawLine(Offset(0, j.toDouble()), Offset(size.width, j.toDouble() - 20), linePaint);
    }

    // Draw central target rings
    final center = Offset(size.width / 2, size.height / 2);
    final ringPaint = Paint()
      ..color = GariLinkColors.accent.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawCircle(center, 40, ringPaint);
    canvas.drawCircle(center, 80, ringPaint);

    // Draw pin drop pinpoints
    final pinPaint = Paint()
      ..color = GariLinkColors.accent
      ..style = PaintingStyle.fill;

    _drawPin(canvas, center, pinPaint);
    _drawPin(canvas, Offset(size.width * 0.25, size.height * 0.35), pinPaint);
    _drawPin(canvas, Offset(size.width * 0.75, size.height * 0.65), pinPaint);
  }

  void _drawPin(Canvas canvas, Offset offset, Paint paint) {
    canvas.drawCircle(offset, 8, paint);
    final path = Path()
      ..moveTo(offset.dx - 8, offset.dy)
      ..lineTo(offset.dx, offset.dy + 16)
      ..lineTo(offset.dx + 8, offset.dy)
      ..close();
    canvas.drawPath(path, paint);
    canvas.drawCircle(offset, 3, Paint()..color = Colors.white);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class OnboardingEarnPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final bgPaint = Paint()..color = GariLinkColors.success.withOpacity(0.04);
    canvas.drawRect(Offset.zero & size, bgPaint);

    // Draw stylized earnings bar chart outline
    final barPaint = Paint()
      ..color = GariLinkColors.success.withOpacity(0.2)
      ..style = PaintingStyle.fill;

    final double barWidth = 32.0;
    final double spacing = 16.0;
    final double startX = (size.width - (4 * barWidth + 3 * spacing)) / 2;

    final heights = [60.0, 100.0, 80.0, 140.0];

    for (int i = 0; i < heights.length; i++) {
      final double x = startX + i * (barWidth + spacing);
      final double y = size.height - heights[i] - 30;
      final rect = RRect.fromRectAndCorners(
        Rect.fromLTWH(x, y, barWidth, heights[i]),
        topLeft: const Radius.circular(8),
        topRight: const Radius.circular(8),
      );
      canvas.drawRRect(rect, barPaint);
    }

    // Draw trend line
    final trendPaint = Paint()
      ..color = GariLinkColors.success
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round;

    final path = Path()
      ..moveTo(startX + barWidth / 2, size.height - heights[0] - 30)
      ..lineTo(startX + barWidth / 2 + barWidth + spacing, size.height - heights[1] - 30)
      ..lineTo(startX + barWidth / 2 + 2 * (barWidth + spacing), size.height - heights[2] - 30)
      ..lineTo(startX + barWidth / 2 + 3 * (barWidth + spacing), size.height - heights[3] - 30);

    canvas.drawPath(path, trendPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class OnboardingTrackPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final bgPaint = Paint()..color = GariLinkColors.accent.withOpacity(0.04);
    canvas.drawRect(Offset.zero & size, bgPaint);

    final radarPaint = Paint()
      ..color = GariLinkColors.accent.withOpacity(0.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final center = Offset(size.width / 2, size.height / 2);
    
    // Draw radar sweeps
    canvas.drawCircle(center, 30, radarPaint);
    canvas.drawCircle(center, 60, radarPaint);
    canvas.drawCircle(center, 90, radarPaint);

    // Draw sweep line
    final linePaint = Paint()
      ..color = GariLinkColors.accent
      ..strokeWidth = 2.0;
    canvas.drawLine(center, Offset(center.dx + 70, center.dy - 50), linePaint);

    // Draw blinking target
    final targetPaint = Paint()
      ..color = GariLinkColors.accent
      ..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(center.dx + 40, center.dy - 30), 6, targetPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
