import 'transport_need.dart';
import '../../../location/domain/models/gari_location.dart';
import '../../../vehicle/domain/models/rental_pricing.dart';
import '../../../owner/domain/operator_workspace.dart';

class RentalVehicleSummary {
  const RentalVehicleSummary({
    required this.make,
    required this.model,
    required this.year,
    this.imageUrl,
  });

  final String make;
  final String model;
  final int year;
  final String? imageUrl;

  factory RentalVehicleSummary.fromJson(Map<String, dynamic> json) {
    return RentalVehicleSummary(
      make: json['make']?.toString() ?? '',
      model: json['model']?.toString() ?? '',
      year: (json['year'] as num?)?.toInt() ?? 0,
      imageUrl: json['imageUrl']?.toString(),
    );
  }
}

class RentalCustomerSummary {
  const RentalCustomerSummary({
    required this.id,
    required this.displayName,
    required this.phoneNumber,
    this.photoUrl,
  });

  final String id;
  final String displayName;
  final String phoneNumber;
  final String? photoUrl;

  factory RentalCustomerSummary.fromJson(Map<String, dynamic> json) {
    return RentalCustomerSummary(
      id: json['id']?.toString() ?? '',
      displayName: json['displayName']?.toString() ?? 'GariLink customer',
      phoneNumber: json['phoneNumber']?.toString() ?? '',
      photoUrl: json['photoUrl']?.toString(),
    );
  }
}

class RentalSummary {
  const RentalSummary({
    required this.id,
    required this.workspaceId,
    required this.listingId,
    required this.vehicleId,
    required this.status,
    required this.startDate,
    required this.endDate,
    required this.dailyRate,
    required this.currency,
    required this.totalAmount,
    required this.title,
    required this.vehicle,
    required this.createdAt,
    required this.updatedAt,
    this.depositAmount,
    this.pricingEstimate,
    this.pickupNotes,
    this.rejectionReason,
    this.county,
    this.customer,
    this.transportNeed,
    this.pickupLocation,
    this.destinationLocation,
  });

  final String id;
  final String workspaceId;
  final String listingId;
  final String vehicleId;
  final String status;
  final DateTime startDate;
  final DateTime endDate;
  final double dailyRate;
  final String currency;
  final double totalAmount;
  final double? depositAmount;
  final RentalPriceEstimate? pricingEstimate;
  final String? pickupNotes;
  final String? rejectionReason;
  final String title;
  final String? county;
  final RentalVehicleSummary vehicle;
  final RentalCustomerSummary? customer;
  final TransportNeed? transportNeed;
  final GariLocation? pickupLocation;
  final GariLocation? destinationLocation;
  final DateTime createdAt;
  final DateTime updatedAt;

  bool get canCustomerCancel =>
      status == 'REQUESTED' || status == 'UNDER_REVIEW' || status == 'APPROVED';
  int get rentalDays => endDate.difference(startDate).inDays;
  int? get estimatedAmountMinor =>
      pricingEstimate?.status == RentalEstimateStatus.estimated
      ? pricingEstimate?.finalEstimatedAmountMinor
      : null;

  factory RentalSummary.fromJson(Map<String, dynamic> json) {
    final listing =
        (json['listing'] as Map?)?.cast<String, dynamic>() ?? const {};
    final vehicle =
        (listing['vehicle'] as Map?)?.cast<String, dynamic>() ?? const {};
    final customer = (json['customer'] as Map?)?.cast<String, dynamic>();
    return RentalSummary(
      id: json['id']?.toString() ?? '',
      workspaceId: json['workspaceId']?.toString() ?? '',
      listingId: json['listingId']?.toString() ?? '',
      vehicleId: json['vehicleId']?.toString() ?? '',
      status: json['status']?.toString() ?? 'REQUESTED',
      startDate: DateTime.parse(json['startDate'].toString()).toLocal(),
      endDate: DateTime.parse(json['endDate'].toString()).toLocal(),
      dailyRate: (json['dailyRate'] as num?)?.toDouble() ?? 0,
      currency: json['currency']?.toString() ?? 'TZS',
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0,
      depositAmount: (json['depositAmount'] as num?)?.toDouble(),
      pricingEstimate: json['pricingEstimate'] is Map
          ? RentalPriceEstimate.fromJson(
              Map<String, dynamic>.from(json['pricingEstimate'] as Map),
            )
          : null,
      pickupNotes: json['pickupNotes']?.toString(),
      transportNeed: TransportNeed.fromJson(json['transportNeed']),
      pickupLocation: json['pickupLocation'] == null
          ? null
          : GariLocation.fromJson(json['pickupLocation']),
      destinationLocation: json['destinationLocation'] == null
          ? null
          : GariLocation.fromJson(json['destinationLocation']),
      rejectionReason: json['rejectionReason']?.toString(),
      title: listing['title']?.toString() ?? 'Vehicle rental',
      county: listing['county']?.toString(),
      vehicle: RentalVehicleSummary.fromJson(vehicle),
      customer: customer == null
          ? null
          : RentalCustomerSummary.fromJson(customer),
      createdAt: DateTime.parse(json['createdAt'].toString()).toLocal(),
      updatedAt: DateTime.parse(json['updatedAt'].toString()).toLocal(),
    );
  }
}

@Deprecated('Use OperatorWorkspace')
typedef WorkspaceSummary = OperatorWorkspace;
