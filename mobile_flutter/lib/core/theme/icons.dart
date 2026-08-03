import 'package:flutter/material.dart';

/// Central icon references for GariLink.
/// Use these instead of raw Icons.xxx to keep the design consistent.
class GariLinkIcons {
  GariLinkIcons._();

  // Navigation
  static const IconData home         = Icons.home_outlined;
  static const IconData homeActive   = Icons.home_rounded;
  static const IconData explore      = Icons.search_rounded;
  static const IconData trips        = Icons.calendar_month_outlined;
  static const IconData tripsActive  = Icons.calendar_month_rounded;
  static const IconData profile      = Icons.person_outline_rounded;
  static const IconData profileActive= Icons.person_rounded;
  static const IconData menu         = Icons.menu_rounded;
  static const IconData add          = Icons.add_rounded;

  // Owner nav
  static const IconData bookings        = Icons.book_online_outlined;
  static const IconData bookingsActive  = Icons.book_online_rounded;
  static const IconData vehicles        = Icons.directions_car_outlined;
  static const IconData vehiclesActive  = Icons.directions_car_rounded;

  // Actions
  static const IconData search    = Icons.search_rounded;
  static const IconData filter    = Icons.tune_rounded;
  static const IconData sort      = Icons.sort_rounded;
  static const IconData bookmark  = Icons.bookmark_border_rounded;
  static const IconData bookmarkFilled = Icons.bookmark_rounded;
  static const IconData share     = Icons.share_outlined;
  static const IconData back      = Icons.arrow_back_ios_new_rounded;
  static const IconData close     = Icons.close_rounded;
  static const IconData check     = Icons.check_rounded;
  static const IconData chevronRight = Icons.chevron_right_rounded;
  static const IconData moreVert  = Icons.more_vert_rounded;

  // Notifications
  static const IconData notification = Icons.notifications_outlined;
  static const IconData notificationActive = Icons.notifications_rounded;

  // Vehicle specs
  static const IconData suv       = Icons.directions_car_filled_rounded;
  static const IconData sedan     = Icons.directions_car_rounded;
  static const IconData pickup    = Icons.local_shipping_outlined;
  static const IconData engine    = Icons.settings_outlined;
  static const IconData fuel      = Icons.local_gas_station_outlined;
  static const IconData seats     = Icons.airline_seat_recline_normal_rounded;
  static const IconData transmission = Icons.settings_input_component_outlined;
  static const IconData speedometer  = Icons.speed_rounded;

  // Categories
  static const IconData rent      = Icons.car_rental_rounded;
  static const IconData garage    = Icons.garage_outlined;
  static const IconData spareParts= Icons.build_outlined;
  static const IconData track     = Icons.place_outlined;
  static const IconData diy       = Icons.handyman_outlined;

  // Business
  static const IconData earnings  = Icons.attach_money_rounded;
  static const IconData analytics = Icons.bar_chart_rounded;
  static const IconData addVehicle = Icons.add_circle_outline_rounded;
  static const IconData listings  = Icons.list_alt_rounded;
  static const IconData requests  = Icons.inbox_outlined;
  static const IconData team      = Icons.group_outlined;
  static const IconData subscription = Icons.workspace_premium_outlined;
  static const IconData payments  = Icons.payments_outlined;

  // Profile
  static const IconData personalInfo  = Icons.person_outline_rounded;
  static const IconData paymentMethods = Icons.credit_card_outlined;
  static const IconData savedVehicles = Icons.favorite_border_rounded;
  static const IconData help          = Icons.help_outline_rounded;
  static const IconData settings      = Icons.settings_outlined;
  static const IconData logout        = Icons.logout_rounded;
  static const IconData verifiedBadge = Icons.verified_rounded;
  static const IconData businessProfile = Icons.business_outlined;
  static const IconData contactSupport  = Icons.headset_mic_outlined;
  static const IconData feedback        = Icons.rate_review_outlined;

  // Location & Map
  static const IconData location   = Icons.location_on_rounded;
  static const IconData map        = Icons.map_outlined;
  static const IconData navigation = Icons.navigation_rounded;

  // Ratings
  static const IconData starFilled = Icons.star_rounded;
  static const IconData starHalf   = Icons.star_half_rounded;
  static const IconData starEmpty  = Icons.star_outline_rounded;

  // Message
  static const IconData message   = Icons.message_outlined;
  static const IconData phone     = Icons.phone_outlined;

  // Calendar
  static const IconData calendar  = Icons.calendar_today_outlined;
  static const IconData clock     = Icons.access_time_rounded;

  // Status
  static const IconData confirmed   = Icons.check_circle_outline_rounded;
  static const IconData pending     = Icons.hourglass_empty_rounded;
  static const IconData cancelled   = Icons.cancel_outlined;
  static const IconData ongoing     = Icons.play_circle_outline_rounded;
  static const IconData completedIcon = Icons.task_alt_rounded;
}
