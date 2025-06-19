import 'package:application/auth/token_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:application/server/dio_instance.dart';
import 'package:logger/logger.dart';

final _logger = Logger();

final authValidationProvider = FutureProvider<bool>((ref) async {
  final tokenAsync = await ref.watch(tokenProvider.future); // wait for token
  if (tokenAsync == null) {
    _logger.w('No token found in secure storage');
    return false;
  }
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/auth/is-validate');

    final newToken = response.data['token'];
    final isValid = response.data['valid'];

    if (!isValid || newToken == null) {
      _logger.w('Token is invalid or missing');
      return false;
    }
    _logger.i('✅ Token validated successfully');
    return true;
  } catch (e) {
    _logger.e('❌ Auth validation failed: $e');
    return false;
  }
});
