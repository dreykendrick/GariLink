import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:garilink_mobile/core/theme/theme.dart';

class RatingWidget extends StatelessWidget {
  final double rating;
  final int? reviewCount;
  final bool showCount;
  final double iconSize;
  final double textSize;

  const RatingWidget.small({
    Key? key,
    required this.rating,
    this.reviewCount,
    this.showCount = false,
  })  : iconSize = 12.0,
        textSize = 11.0,
        super(key: key);

  const RatingWidget.large({
    Key? key,
    required this.rating,
    this.reviewCount,
    this.showCount = false,
  })  : iconSize = 16.0,
        textSize = 14.0,
        super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(
          Icons.star,
          size: iconSize,
          color: const Color(0xFFFFC107),
        ),
        const SizedBox(width: 4),
        Text(
          rating.toStringAsFixed(1),
          style: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
            fontSize: textSize,
            color: const Color(0xFF0B1F3A),
          ),
        ),
        if (showCount && reviewCount != null) ...[
          const SizedBox(width: 4),
          Text(
            '($reviewCount)',
            style: GoogleFonts.inter(
              fontWeight: FontWeight.w400,
              fontSize: textSize,
              color: Colors.grey[600],
            ),
          ),
        ],
      ],
    );
  }
}

