import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:logger/logger.dart';

final _logger = Logger();

class AppUser {
  final String name;
  final String email;
  final String image;

  AppUser({
    required this.name,
    required this.email,
    required this.image,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        name: json['name'] ?? '',
        email: json['email'] ?? '',
        image: json['image'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'email': email,
        'image': image,
      };
}

// In-memory cache that survives hot restart
class _PersistentUserStorage {
  static AppUser? _user;
  static bool _isInitialized = false;

  static AppUser? get user => _user;

  static void setUser(AppUser? user) {
    _user = user;
    _isInitialized = true;
  }

  static bool get isInitialized => _isInitialized;
}

final userProvider =
    AsyncNotifierProvider<UserController, AppUser?>(() => UserController());

class UserController extends AsyncNotifier<AppUser?> {
  static const _userKey = 'app_user';

  @override
  FutureOr<AppUser?> build() async {
    if (_PersistentUserStorage.isInitialized) {
      _logger.i("✅ Using cached user from memory");
      return _PersistentUserStorage.user;
    }

    // First attempt
    try {
      final user = await _loadUserFromPrefs();
      _PersistentUserStorage.setUser(user);
      return user;
    } catch (e) {
      _logger.w("⚠️ First SharedPreferences attempt failed: $e");
    }

    // Retry after short delay
    try {
      _logger.i("🔁 Retrying SharedPreferences after delay...");
      await Future.delayed(const Duration(milliseconds: 150));
      final user = await _loadUserFromPrefs();
      _PersistentUserStorage.setUser(user);
      return user;
    } catch (e) {
      _logger.e("❌ Failed to load user from SharedPreferences after retry: $e");
      _PersistentUserStorage.setUser(null);
      return null;
    }
  }

  Future<AppUser?> _loadUserFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString(_userKey);

    if (jsonStr == null) {
      _logger.i("ℹ️ No user JSON found in SharedPreferences");
      return null;
    }

    _logger.i("📦 Found user JSON: $jsonStr");

    final data = json.decode(jsonStr);
    return AppUser.fromJson(data);
  }

  Future<void> setUser(AppUser user) async {
    _PersistentUserStorage.setUser(user);
    state = AsyncValue.data(user);
    _logger.i("✅ User set in memory");

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_userKey, json.encode(user.toJson()));
      _logger.i("💾 User saved to SharedPreferences");
    } catch (e) {
      _logger.w("⚠️ Failed to save user to SharedPreferences: $e");
    }
  }

  Future<void> clearUser() async {
    _PersistentUserStorage.setUser(null);
    state = const AsyncValue.data(null);
    _logger.i("🧹 User cleared from memory");

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_userKey);
      _logger.i("🗑️ User removed from SharedPreferences");
    } catch (e) {
      _logger.w("⚠️ Failed to clear user from SharedPreferences: $e");
    }
  }
}
