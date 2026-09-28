import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../core/theme/colors.dart';
import '../../core/theme/animations.dart';

class VehicleImage extends StatelessWidget {
  const VehicleImage({
    required this.url,
    this.fit = BoxFit.cover,
    this.semanticLabel = 'Vehicle photo',
    super.key,
  });
  final String? url;
  final BoxFit fit;
  final String semanticLabel;

  @override
  Widget build(BuildContext context) {
    final value = url?.trim() ?? '';
    if (value.isEmpty) return _Fallback(semanticLabel: semanticLabel);
    return CachedNetworkImage(
      imageUrl: value,
      fit: fit,
      imageBuilder: (_, imageProvider) =>
          Image(image: imageProvider, fit: fit, semanticLabel: semanticLabel),
      fadeInDuration: GariLinkAnimations.duration(
        context,
        GariLinkAnimations.short,
      ),
      fadeOutDuration: GariLinkAnimations.duration(
        context,
        GariLinkAnimations.instant,
      ),
      memCacheWidth: 720,
      placeholder: (_, _) => const ColoredBox(
        color: GariLinkColors.neutral100,
        child: Center(
          child: SizedBox.square(
            dimension: 22,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      ),
      errorWidget: (_, _, _) => _Fallback(semanticLabel: semanticLabel),
    );
  }
}

class _Fallback extends StatelessWidget {
  const _Fallback({required this.semanticLabel});
  final String semanticLabel;
  @override
  Widget build(BuildContext context) => Semantics(
    image: true,
    label: '$semanticLabel unavailable',
    child: const ExcludeSemantics(
      child: ColoredBox(
        color: GariLinkColors.neutral100,
        child: Center(
          child: Icon(
            Icons.directions_car_filled_outlined,
            size: 42,
            color: GariLinkColors.textMuted,
          ),
        ),
      ),
    ),
  );
}
