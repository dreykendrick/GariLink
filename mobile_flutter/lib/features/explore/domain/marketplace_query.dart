enum MarketplaceSort {
  newest('Newest first', 'NEWEST'),
  priceLow('Price: low to high', 'PRICE_ASC'),
  priceHigh('Price: high to low', 'PRICE_DESC'),
  yearNewest('Newest model year', 'YEAR_DESC'),
  mileageLow('Lowest mileage', 'MILEAGE_ASC');

  const MarketplaceSort(this.label, this.apiValue);
  final String label;
  final String apiValue;
}

class MarketplaceQuery {
  const MarketplaceQuery({
    this.text = '',
    this.type,
    this.location = '',
    this.minPrice,
    this.maxPrice,
    this.transmission,
    this.fuelType,
    this.sort = MarketplaceSort.newest,
    this.page = 1,
    this.limit = 30,
  });

  final String text;
  final String? type;
  final String location;
  final double? minPrice;
  final double? maxPrice;
  final String? transmission;
  final String? fuelType;
  final MarketplaceSort sort;
  final int page;
  final int limit;

  bool get hasFilters =>
      (type != null && type != 'FOR_HIRE') ||
      location.isNotEmpty ||
      minPrice != null ||
      maxPrice != null ||
      transmission != null ||
      fuelType != null;

  int get filterCount => [
    type == 'FOR_HIRE' ? null : type,
    location.isEmpty ? null : location,
    minPrice == null && maxPrice == null ? null : 'price',
    transmission,
    fuelType,
  ].where((value) => value != null).length;

  MarketplaceQuery copyWith({
    String? text,
    String? type,
    bool clearType = false,
    String? location,
    double? minPrice,
    double? maxPrice,
    bool clearPrice = false,
    String? transmission,
    bool clearTransmission = false,
    String? fuelType,
    bool clearFuelType = false,
    MarketplaceSort? sort,
    int? page,
  }) => MarketplaceQuery(
    text: text ?? this.text,
    type: clearType ? null : type ?? this.type,
    location: location ?? this.location,
    minPrice: clearPrice ? null : minPrice ?? this.minPrice,
    maxPrice: clearPrice ? null : maxPrice ?? this.maxPrice,
    transmission: clearTransmission ? null : transmission ?? this.transmission,
    fuelType: clearFuelType ? null : fuelType ?? this.fuelType,
    sort: sort ?? this.sort,
    page: page ?? this.page,
    limit: limit,
  );

  MarketplaceQuery clearFilters() => MarketplaceQuery(
    text: text,
    type: type == 'FOR_HIRE' ? 'FOR_HIRE' : null,
    sort: sort,
    limit: limit,
  );

  @override
  bool operator ==(Object other) =>
      other is MarketplaceQuery &&
      other.text == text &&
      other.type == type &&
      other.location == location &&
      other.minPrice == minPrice &&
      other.maxPrice == maxPrice &&
      other.transmission == transmission &&
      other.fuelType == fuelType &&
      other.sort == sort &&
      other.page == page &&
      other.limit == limit;

  @override
  int get hashCode => Object.hash(
    text,
    type,
    location,
    minPrice,
    maxPrice,
    transmission,
    fuelType,
    sort,
    page,
    limit,
  );
}
