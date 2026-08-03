class AppException implements Exception {
  final String message;
  final String? code;
  final int? statusCode;

  const AppException(this.message, {this.code, this.statusCode});

  @override
  String toString() => message;
}

class NetworkException extends AppException {
  const NetworkException(super.message);
}

class UnauthorizedException extends AppException {
  const UnauthorizedException(super.message, {super.code}) : super(statusCode: 401);
}

class ForbiddenException extends AppException {
  const ForbiddenException(super.message, {super.code}) : super(statusCode: 403);
}

class NotFoundException extends AppException {
  const NotFoundException(super.message, {super.code}) : super(statusCode: 404);
}

class ConflictException extends AppException {
  const ConflictException(super.message, {super.code}) : super(statusCode: 409);
}

class ServerException extends AppException {
  const ServerException(super.message, {super.code}) : super(statusCode: 500);
}

class ValidationException extends AppException {
  const ValidationException(super.message, {super.code}) : super(statusCode: 400);
}
