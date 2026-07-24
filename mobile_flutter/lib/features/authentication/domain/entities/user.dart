enum UserRole { customer, privateOwner, dealer, mechanic, inspector, admin }

enum CapabilityType { listVehicles, manageListings, manageRentalListings, manageFleet, performInspections, performRepairs, admin }

enum CapabilityStatus { pending, active, suspended, revoked, rejected }

class UserCapability {
  final String id;
  final CapabilityType type;
  final CapabilityStatus status;

  const UserCapability({
    required this.id,
    required this.type,
    required this.status,
  });
}

class UserProfileEntity {
  final String id;
  final String userId;
  final String? firstName;
  final String? lastName;
  final String? displayName;
  final String? photoUrl;
  final String? bio;
  final String? gender;
  final String? dateOfBirth;
  final String? county;
  final String? city;
  final String country;
  final int completionPercentage;

  const UserProfileEntity({
    required this.id,
    required this.userId,
    this.firstName,
    this.lastName,
    this.displayName,
    this.photoUrl,
    this.bio,
    this.gender,
    this.dateOfBirth,
    this.county,
    this.city,
    required this.country,
    required this.completionPercentage,
  });

  String get fullName {
    final first = firstName ?? '';
    final last = lastName ?? '';
    if (first.isEmpty && last.isEmpty) return displayName ?? 'User';
    return '$first $last'.trim();
  }
}

class User {
  final String id;
  final String phoneNumber;
  final String? email;
  final List<UserRole> roles;
  final bool isPhoneVerified;
  final bool isEmailVerified;
  final UserProfileEntity? profile;
  final List<UserCapability> capabilities;

  const User({
    required this.id,
    required this.phoneNumber,
    this.email,
    required this.roles,
    required this.isPhoneVerified,
    required this.isEmailVerified,
    this.profile,
    required this.capabilities,
  });

  User copyWith({
    String? id,
    String? phoneNumber,
    String? email,
    List<UserRole>? roles,
    bool? isPhoneVerified,
    bool? isEmailVerified,
    UserProfileEntity? profile,
    List<UserCapability>? capabilities,
  }) {
    return User(
      id: id ?? this.id,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      roles: roles ?? this.roles,
      isPhoneVerified: isPhoneVerified ?? this.isPhoneVerified,
      isEmailVerified: isEmailVerified ?? this.isEmailVerified,
      profile: profile ?? this.profile,
      capabilities: capabilities ?? this.capabilities,
    );
  }
}
