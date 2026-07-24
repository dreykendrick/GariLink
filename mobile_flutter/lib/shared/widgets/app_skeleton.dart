import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme/tokens.dart';

class AppSkeleton extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const AppSkeleton({
    required this.width,
    required this.height,
    this.borderRadius = AppBorderRadius.sm,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final baseColor = isDark ? AppColors.neutral[800]! : AppColors.neutral[200]!;
    final highlightColor = isDark ? AppColors.neutral[700]! : AppColors.neutral[100]!;

    return Shimmer.fromColors(
      baseColor: baseColor,
      highlightColor: highlightColor,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.neutral[0],
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }

  // Pre-configured skeleton loader templates
  static Widget cardList({int count = 3}) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: count,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.base),
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.base),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? AppColors.darkCard
                  : AppColors.neutral[0],
              borderRadius: AppBorderRadius.mdBorderRadius,
              border: Border.all(
                color: Theme.of(context).brightness == Brightness.dark
                    ? AppColors.darkBorder
                    : AppColors.neutral[100]!,
              ),
            ),
            child: Row(
              children: [
                const AppSkeleton(width: 80, height: 80, borderRadius: AppBorderRadius.sm),
                const SizedBox(width: AppSpacing.base),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const AppSkeleton(width: 150, height: 16),
                      const SizedBox(height: AppSpacing.sm),
                      const AppSkeleton(width: 100, height: 12),
                      const SizedBox(height: AppSpacing.sm),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.between,
                        children: const [
                          AppSkeleton(width: 60, height: 12),
                          AppSkeleton(width: 40, height: 12),
                        ],
                      ),
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
