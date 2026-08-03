import 'package:flutter/material.dart';
import 'package:garilink_mobile/core/theme/theme.dart';

class AnalyticsPage extends StatelessWidget {
  const AnalyticsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: GariLinkColors.background,
      appBar: AppBar(
        backgroundColor: GariLinkColors.surface,
        elevation: 0,
        title: Text('Analytics', style: GariLinkTypography.titleLarge),
        centerTitle: false,
        iconTheme: const IconThemeData(color: GariLinkColors.textPrimary),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: GariLinkSpacing.lg),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: GariLinkSpacing.md, vertical: GariLinkSpacing.xs),
                decoration: BoxDecoration(
                  color: GariLinkColors.neutral100,
                  borderRadius: BorderRadius.circular(GariLinkRadius.input),
                ),
                child: Row(
                  children: [
                    Text('This Month', style: GariLinkTypography.bodyMedium),
                    const Icon(Icons.arrow_drop_down, color: GariLinkColors.textPrimary),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(GariLinkSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildEarningsCard(),
            const SizedBox(height: GariLinkSpacing.lg),
            _buildBookingsCard(),
            const SizedBox(height: GariLinkSpacing.lg),
            Text('Top Performing Vehicle', style: GariLinkTypography.titleMedium),
            const SizedBox(height: GariLinkSpacing.lg),
            _buildTopVehicleCard(),
          ],
        ),
      ),
    );
  }

  Widget _buildEarningsCard() {
    return Container(
      padding: const EdgeInsets.all(GariLinkSpacing.lg),
      decoration: BoxDecoration(
        color: GariLinkColors.surface,
        borderRadius: BorderRadius.circular(GariLinkRadius.card),
        boxShadow: [
          BoxShadow(color: GariLinkColors.textPrimary.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Earnings Overview', style: GariLinkTypography.bodyMedium.copyWith(color: GariLinkColors.textMuted)),
          const SizedBox(height: GariLinkSpacing.sm),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('\$12,420', style: GariLinkTypography.titleLarge.copyWith(fontSize: 32)),
              const SizedBox(width: GariLinkSpacing.md),
              Padding(
                padding: const EdgeInsets.only(bottom: 6.0),
                child: Text('+11% vs last month', style: GariLinkTypography.bodySmall.copyWith(color: GariLinkColors.success, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: GariLinkSpacing.xl),
          SizedBox(
            height: 120,
            width: double.infinity,
            child: CustomPaint(
              painter: LineChartPainter(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookingsCard() {
    return Container(
      padding: const EdgeInsets.all(GariLinkSpacing.lg),
      decoration: BoxDecoration(
        color: GariLinkColors.surface,
        borderRadius: BorderRadius.circular(GariLinkRadius.card),
        boxShadow: [
          BoxShadow(color: GariLinkColors.textPrimary.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Bookings', style: GariLinkTypography.bodyMedium.copyWith(color: GariLinkColors.textMuted)),
          const SizedBox(height: GariLinkSpacing.sm),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('42', style: GariLinkTypography.titleLarge.copyWith(fontSize: 32)),
              const SizedBox(width: GariLinkSpacing.md),
              Padding(
                padding: const EdgeInsets.only(bottom: 6.0),
                child: Text('+8% vs last month', style: GariLinkTypography.bodySmall.copyWith(color: GariLinkColors.success, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: GariLinkSpacing.xl),
          SizedBox(
            height: 100,
            width: double.infinity,
            child: CustomPaint(
              painter: BarChartPainter(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopVehicleCard() {
    return Container(
      padding: const EdgeInsets.all(GariLinkSpacing.md),
      decoration: BoxDecoration(
        color: GariLinkColors.surface,
        borderRadius: BorderRadius.circular(GariLinkRadius.card),
        boxShadow: [
          BoxShadow(color: GariLinkColors.textPrimary.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 100,
            height: 80,
            decoration: BoxDecoration(
              color: GariLinkColors.neutral100,
              borderRadius: BorderRadius.circular(GariLinkRadius.input),
            ),
            child: const Icon(Icons.directions_car, color: GariLinkColors.textMuted, size: 40),
          ),
          const SizedBox(width: GariLinkSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Toyota Land Cruiser', style: GariLinkTypography.bodyLarge),
                const SizedBox(height: GariLinkSpacing.xs),
                Text('Earnings: \$6,280', style: GariLinkTypography.bodyMedium.copyWith(color: GariLinkColors.accent, fontWeight: FontWeight.bold)),
                const SizedBox(height: GariLinkSpacing.sm),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 8,
                        decoration: BoxDecoration(
                          color: GariLinkColors.neutral100,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: FractionallySizedBox(
                          alignment: Alignment.centerLeft,
                          widthFactor: 0.4,
                          child: Container(
                            decoration: BoxDecoration(
                              color: GariLinkColors.accent,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: GariLinkSpacing.sm),
                    Text('40%', style: GariLinkTypography.bodySmall.copyWith(fontWeight: FontWeight.bold)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class LineChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = GariLinkColors.accent
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final fillPaint = Paint()
      ..color = GariLinkColors.accent.withOpacity(0.1)
      ..style = PaintingStyle.fill;

    final path = Path();
    final fillPath = Path();

    final List<double> data = [0.4, 0.6, 0.5, 0.8, 0.7, 1.0];
    final double stepX = size.width / (data.length - 1);

    path.moveTo(0, size.height - (data[0] * size.height));
    fillPath.moveTo(0, size.height);
    fillPath.lineTo(0, size.height - (data[0] * size.height));

    for (int i = 1; i < data.length; i++) {
      final double x = i * stepX;
      final double y = size.height - (data[i] * size.height);
      
      final double prevX = (i - 1) * stepX;
      final double prevY = size.height - (data[i - 1] * size.height);
      
      final double controlX1 = prevX + (x - prevX) / 2;
      final double controlY1 = prevY;
      final double controlX2 = prevX + (x - prevX) / 2;
      final double controlY2 = y;

      path.cubicTo(controlX1, controlY1, controlX2, controlY2, x, y);
      fillPath.cubicTo(controlX1, controlY1, controlX2, controlY2, x, y);
    }

    fillPath.lineTo(size.width, size.height);
    fillPath.close();

    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(path, paint);

    // Draw points
    final pointPaint = Paint()
      ..color = GariLinkColors.surface
      ..style = PaintingStyle.fill;
    
    final pointStrokePaint = Paint()
      ..color = GariLinkColors.accent
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    for (int i = 0; i < data.length; i++) {
      final double x = i * stepX;
      final double y = size.height - (data[i] * size.height);
      canvas.drawCircle(Offset(x, y), 4, pointPaint);
      canvas.drawCircle(Offset(x, y), 4, pointStrokePaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class BarChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = GariLinkColors.accent
      ..style = PaintingStyle.fill;

    final List<double> data = [0.3, 0.5, 0.4, 0.7, 0.6, 0.9];
    final int barsCount = data.length;
    final double barWidth = (size.width / barsCount) * 0.4;
    final double spacing = (size.width - (barWidth * barsCount)) / (barsCount - 1);

    for (int i = 0; i < barsCount; i++) {
      final double x = i * (barWidth + spacing);
      final double barHeight = data[i] * size.height;
      final double y = size.height - barHeight;

      final rrect = RRect.fromRectAndRadius(
        Rect.fromLTWH(x, y, barWidth, barHeight),
        const Radius.circular(4),
      );
      canvas.drawRRect(rrect, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

