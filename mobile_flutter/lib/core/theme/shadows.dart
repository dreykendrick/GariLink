import 'package:flutter/material.dart';

class GariLinkShadows {
  GariLinkShadows._();

  static const BoxShadow card = BoxShadow(
    color: Color(0x0A000000), // extremely soft 4% opacity black
    offset: Offset(0, 4),
    blurRadius: 16,
    spreadRadius: 0,
  );

  static const BoxShadow button = BoxShadow(
    color: Color(0x1F2D7FF9), // soft accent-colored shadow
    offset: Offset(0, 6),
    blurRadius: 12,
    spreadRadius: -2,
  );

  static const BoxShadow softOverlay = BoxShadow(
    color: Color(0x1A000000), // 10% opacity black
    offset: Offset(0, 10),
    blurRadius: 30,
    spreadRadius: 0,
  );
}
