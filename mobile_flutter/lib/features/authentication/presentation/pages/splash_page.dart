import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/spacing.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _carDrawAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
      ),
    );

    _carDrawAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.3, 0.9, curve: Curves.easeInOut),
      ),
    );

    _controller.forward();

    Timer(const Duration(milliseconds: 3200), () {
      if (mounted) {
        context.go('/onboarding');
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: GariLinkColors.primary,
      body: SafeArea(
        child: Stack(
          children: [
            // Center Logo and Tagline
            Center(
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: GariLinkColors.accent,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: GariLinkColors.accent.withOpacity(0.3),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          )
                        ],
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.directions_car_filled_outlined,
                          color: Colors.white,
                          size: 44,
                        ),
                      ),
                    ),
                    const SizedBox(height: GariLinkSpacing.xxl),
                    Text(
                      'GariLink',
                      style: GoogleFonts.inter(
                        fontSize: 36,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: -1.0,
                      ),
                    ),
                    const SizedBox(height: GariLinkSpacing.sm),
                    Text(
                      'Everything Cars. One App.',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Animated Car Outline in the lower half
            Positioned(
              bottom: 120,
              left: 40,
              right: 40,
              height: 120,
              child: AnimatedBuilder(
                animation: _carDrawAnimation,
                builder: (context, child) {
                  return CustomPaint(
                    painter: CarOutlinePainter(_carDrawAnimation.value),
                  );
                },
              ),
            ),

            // Slider Indicators
            Positioned(
              bottom: 40,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  3,
                  (index) => Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: index == 0 ? 16 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: index == 0
                          ? GariLinkColors.accent
                          : Colors.white.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CarOutlinePainter extends CustomPainter {
  final double progress;

  CarOutlinePainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = GariLinkColors.accent.withOpacity(0.6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round;

    final path = Path();
    
    // Draw a luxury side profile silhouette of an SUV
    path.moveTo(0, size.height * 0.85); // Back wheel area start
    path.lineTo(size.width * 0.15, size.height * 0.85);
    
    // Rear wheel arch
    path.arcToPoint(
      Offset(size.width * 0.28, size.height * 0.85),
      radius: const Radius.circular(20),
      clockwise: false,
    );
    
    path.lineTo(size.width * 0.62, size.height * 0.85); // Underbody
    
    // Front wheel arch
    path.arcToPoint(
      Offset(size.width * 0.75, size.height * 0.85),
      radius: const Radius.circular(20),
      clockwise: false,
    );
    
    path.lineTo(size.width, size.height * 0.85); // Front bumper
    path.lineTo(size.width * 0.96, size.height * 0.68); // Hood front
    path.lineTo(size.width * 0.80, size.height * 0.65); // Hood
    path.lineTo(size.width * 0.68, size.height * 0.40); // Windshield
    path.lineTo(size.width * 0.35, size.height * 0.38); // Roof
    path.lineTo(size.width * 0.25, size.height * 0.40); // Rear spoiler/roof end
    path.lineTo(size.width * 0.10, size.height * 0.58); // Rear hatch window
    path.lineTo(size.width * 0.02, size.height * 0.68); // Rear bumper
    path.close();

    // Animate drawing path
    final pms = path.computeMetrics();
    final animatedPath = Path();
    for (final pm in pms) {
      final len = pm.length * progress;
      animatedPath.addPath(pm.extractPath(0, len), Offset.zero);
    }

    canvas.drawPath(animatedPath, paint);

    // Draw wheels
    final wheelPaint = Paint()
      ..color = GariLinkColors.accent.withOpacity(0.8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;

    if (progress > 0.7) {
      final wheelProg = (progress - 0.7) / 0.3;
      canvas.drawCircle(
        Offset(size.width * 0.215, size.height * 0.85),
        15 * wheelProg,
        wheelPaint,
      );
      canvas.drawCircle(
        Offset(size.width * 0.685, size.height * 0.85),
        15 * wheelProg,
        wheelPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CarOutlinePainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
