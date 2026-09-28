import 'package:flutter/material.dart';

import '../../core/formatters/marketplace_formatters.dart';
import '../../core/theme/theme.dart';

class PriceText extends StatelessWidget {
  const PriceText({
    required this.amount,
    this.currency = 'TZS',
    this.suffix,
    this.compact = false,
    this.color,
    super.key,
  });

  final Object? amount;
  final String currency;
  final String? suffix;
  final bool compact;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final price = formatMarketplacePrice(amount, currency: currency);
    final text = '$price${suffix == null ? '' : ' $suffix'}';
    return Semantics(
      label: text.replaceAll('/', 'per '),
      child: Text(
        text,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style:
            (compact
                    ? GariLinkTypography.priceCompact
                    : GariLinkTypography.price)
                .copyWith(color: color),
      ),
    );
  }
}
