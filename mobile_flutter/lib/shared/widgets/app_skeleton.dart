import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/spacing.dart';
import '../../core/theme/radius.dart';

/// A shimmer-style skeleton loader that shows a pulsing animation.
/// Does not require the shimmer package — uses a simple AnimatedContainer approach.
class AppSkeleton extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const AppSkeleton({
    required this.width,
    required this.height,
    this.borderRadius = GariLinkRadius.badge,
    super.key,
  });

  @override
  State<AppSkeleton> createState() => _AppSkeletonState();

  /// Pre-configured card list skeleton.
  static Widget cardList({int count = 3}) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: count,
      itemBuilder: (context, index) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        return Padding(
          padding: const EdgeInsets.only(bottom: GariLinkSpacing.lg),
          child: Container(
            padding: const EdgeInsets.all(GariLinkSpacing.lg),
            decoration: BoxDecoration(
              color: isDark ? GariLinkColors.darkSurfaceVariant : GariLinkColors.surface,
              borderRadius: GariLinkRadius.cardBorderRadius,
              border: Border.all(
                color: isDark ? GariLinkColors.darkBorder : GariLinkColors.neutral200,
              ),
            ),
            child: Row(
              children: [
                const AppSkeleton(width: 80, height: 80, borderRadius: GariLinkRadius.badge),
                const SizedBox(width: GariLinkSpacing.lg),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      AppSkeleton(width: 150, height: 16),
                      SizedBox(height: GariLinkSpacing.sm),
                      AppSkeleton(width: 100, height: 12),
                      SizedBox(height: GariLinkSpacing.sm),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _AppSkeletonState extends State<AppSkeleton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final baseColor = isDark ? GariLinkColors.neutral700 : GariLinkColors.neutral200;

    return FadeTransition(
      opacity: _animation,
      child: Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          color: baseColor,
          borderRadius: BorderRadius.circular(widget.borderRadius),
        ),
      ),
    );
  }
}
