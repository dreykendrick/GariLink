import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';

class Avatar extends StatelessWidget {
  final String? imageUrl;
  final String? initials;
  final double size;

  const Avatar({
    this.imageUrl,
    this.initials,
    this.size = 40.0,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final fallbackBg = isDark ? const Color(0xFF1E2D4A) : GariLinkColors.borderLight;
    final fallbackText = isDark ? GariLinkColors.textMuted : GariLinkColors.primary;

    Widget? getForeground() {
      if (imageUrl != null && imageUrl!.isNotEmpty) {
        return ClipOval(
          child: Image.network(
            imageUrl!,
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => _fallbackWidget(fallbackBg, fallbackText),
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return SizedBox(
                width: size,
                height: size,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(theme.colorScheme.primary),
                ),
              );
            },
          ),
        );
      }
      return _fallbackWidget(fallbackBg, fallbackText);
    }

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: fallbackBg,
        shape: BoxShape.circle,
      ),
      child: getForeground(),
    );
  }

  Widget _fallbackWidget(Color bg, Color textColor) {
    final displayText = initials != null && initials!.isNotEmpty ? initials!.toUpperCase() : '?';
    return Center(
      child: Text(
        displayText,
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.bold,
          fontSize: size * 0.4,
        ),
      ),
    );
  }
}
