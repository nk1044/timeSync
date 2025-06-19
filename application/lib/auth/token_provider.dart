import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const secureStorage = FlutterSecureStorage(
  aOptions: AndroidOptions(
    encryptedSharedPreferences: true,
  ),
  iOptions: IOSOptions(
    accessibility: KeychainAccessibility.first_unlock_this_device,
  ),
);

final tokenProvider =
    AsyncNotifierProvider<TokenController, String?>(() => TokenController());

class TokenController extends AsyncNotifier<String?> {
  static const _tokenKey = 'auth_token';

  @override
  FutureOr<String?> build() async {
    try {
      final token = await secureStorage.read(key: _tokenKey);
      return token;
    } catch (e) {
      // Handle secure storage errors gracefully
      return null;
    }
  }

  Future<void> setToken(String token) async {
    try {
      await secureStorage.write(key: _tokenKey, value: token);
      state = AsyncValue.data(token);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  Future<void> clearToken() async {
    try {
      await secureStorage.delete(key: _tokenKey);
      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }
}