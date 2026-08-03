import '../../domain/entities/user.dart';

class UserProfileModel {
  static UserProfileEntity fromJson(Map<String, dynamic> json) {
    return UserProfileEntity(
      id: json['id'] as String,
      userId: json['userId'] as String,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      displayName: json['displayName'] as String?,
      photoUrl: json['photoUrl'] as String?,
      bio: json['bio'] as String?,
      gender: json['gender'] as String?,
      dateOfBirth: json['dateOfBirth'] as String?,
      county: json['county'] as String?,
      city: json['city'] as String?,
      country: json['country'] as String? ?? 'Kenya',
      completionPercentage: (json['completionPercentage'] as num?)?.toInt() ?? 0,
    );
  }

  static Map<String, dynamic> toJson(UserProfileEntity profile) {
    return {
      'id': profile.id,
      'userId': profile.userId,
      'firstName': profile.firstName,
      'lastName': profile.lastName,
      'displayName': profile.displayName,
      'photoUrl': profile.photoUrl,
      'bio': profile.bio,
      'gender': profile.gender,
      'dateOfBirth': profile.dateOfBirth,
      'county': profile.county,
      'city': profile.city,
      'country': profile.country,
      'completionPercentage': profile.completionPercentage,
    };
  }
}

class UserModel {
  static UserRole mapRole(String roleStr) {
    switch (roleStr.toUpperCase()) {
      case 'CUSTOMER':
        return UserRole.customer;
      case 'PRIVATE_OWNER':
        return UserRole.privateOwner;
      case 'DEALER':
        return UserRole.dealer;
      case 'MECHANIC':
        return UserRole.mechanic;
      case 'INSPECTOR':
        return UserRole.inspector;
      case 'ADMIN':
        return UserRole.admin;
      default:
        return UserRole.customer;
    }
  }

  static String roleToString(UserRole role) {
    switch (role) {
      case UserRole.customer:
        return 'CUSTOMER';
      case UserRole.privateOwner:
        return 'PRIVATE_OWNER';
      case UserRole.dealer:
        return 'DEALER';
      case UserRole.mechanic:
        return 'MECHANIC';
      case UserRole.inspector:
        return 'INSPECTOR';
      case UserRole.admin:
        return 'ADMIN';
    }
  }

  static CapabilityType mapCapabilityType(String capStr) {
    switch (capStr.toUpperCase()) {
      case 'LIST_VEHICLES':
        return CapabilityType.listVehicles;
      case 'MANAGE_LISTINGS':
        return CapabilityType.manageListings;
      case 'MANAGE_RENTAL_LISTINGS':
        return CapabilityType.manageRentalListings;
      case 'MANAGE_FLEET':
        return CapabilityType.manageFleet;
      case 'PERFORM_INSPECTIONS':
        return CapabilityType.performInspections;
      case 'PERFORM_REPAIRS':
        return CapabilityType.performRepairs;
      case 'ADMIN':
        return CapabilityType.admin;
      default:
        return CapabilityType.listVehicles;
    }
  }

  static CapabilityStatus mapCapabilityStatus(String statusStr) {
    switch (statusStr.toUpperCase()) {
      case 'PENDING':
        return CapabilityStatus.pending;
      case 'ACTIVE':
        return CapabilityStatus.active;
      case 'SUSPENDED':
        return CapabilityStatus.suspended;
      case 'REVOKED':
        return CapabilityStatus.revoked;
      case 'REJECTED':
        return CapabilityStatus.rejected;
      default:
        return CapabilityStatus.pending;
    }
  }

  static User fromJson(Map<String, dynamic> json) {
    final rawRoles = json['roles'] as List<dynamic>?;
    final rolesList = rawRoles?.map((e) {
      if (e is String) return mapRole(e);
      if (e is Map<String, dynamic> && e['role'] is String) return mapRole(e['role'] as String);
      return UserRole.customer;
    }).toList() ?? [UserRole.customer];

    final capabilitiesList = (json['capabilities'] as List<dynamic>?)?.map((e) {
      final map = e as Map<String, dynamic>;
      return UserCapability(
        id: map['id'] as String,
        type: mapCapabilityType(map['type'] as String),
        status: mapCapabilityStatus(map['status'] as String),
      );
    }).toList() ?? [];

    final profileData = json['profile'];

    return User(
      id: json['id'] as String,
      phoneNumber: json['phoneNumber'] as String,
      email: json['email'] as String?,
      roles: rolesList,
      isPhoneVerified: json['isPhoneVerified'] as bool? ?? false,
      isEmailVerified: json['isEmailVerified'] as bool? ?? false,
      profile: profileData != null
          ? UserProfileModel.fromJson(profileData as Map<String, dynamic>)
          : null,
      capabilities: capabilitiesList,
    );
  }

  static Map<String, dynamic> toJson(User user) {
    return {
      'id': user.id,
      'phoneNumber': user.phoneNumber,
      'email': user.email,
      'roles': user.roles.map((e) => roleToString(e)).toList(),
      'isPhoneVerified': user.isPhoneVerified,
      'isEmailVerified': user.isEmailVerified,
      'profile': user.profile != null ? UserProfileModel.toJson(user.profile!) : null,
      'capabilities': user.capabilities.map((e) => {
        'id': e.id,
        'type': e.type.toString().split('.').last.toUpperCase(), // basic serialisation
        'status': e.status.toString().split('.').last.toUpperCase(),
      }).toList(),
    };
  }
}
