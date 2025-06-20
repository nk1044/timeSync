import 'package:application/auth/auth_repository.dart';
import 'package:application/auth/token_provider.dart';
import 'package:application/server/dio_instance.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:logger/logger.dart';
import 'package:dio/dio.dart';
import 'dart:io';

final _logger = Logger();

class FCMTokenService {
  static bool _tokenRegistered = false;
  static bool _isInitialized = false;
  
  static Future<void> initializeFCMToken(Dio dio) async {
    if (_isInitialized) {
      _logger.i('📱 FCM already initialized, skipping');
      return;
    }
    
    try {
      _isInitialized = true;
      
      // Listen for token refresh
      await FirebaseMessaging.instance.onTokenRefresh.listen((fcmToken) async{
        _logger.i('🔄 FCM token refreshed: $fcmToken');
        await _sendTokenToServer(dio, fcmToken);
      });

      // Try to get initial token
      await _getAndRegisterToken(dio);
    } catch (e) {
      _logger.e('❌ Error initializing FCM token: $e');
      _isInitialized = false; // Reset on error
    }
  }

  static Future<void> _getAndRegisterToken(Dio dio) async {
    try {
      String? fcmToken;

      if (Platform.isIOS) {
        // For iOS, wait for APNS token first
        _logger.i('📱 iOS detected - waiting for APNS token');
        
        bool apnsTokenAvailable = false;
        
        // Try to get APNS token with retry logic
        for (int i = 0; i < 5; i++) {
          final apnsToken = await FirebaseMessaging.instance.getAPNSToken();
          if (apnsToken != null) {
            _logger.i('🍎 APNS token available');
            apnsTokenAvailable = true;
            break;
          }
          _logger.i('⏳ Waiting for APNS token... attempt ${i + 1}');
          await Future.delayed(Duration(seconds: 1 + i));
        }
        
        // Only proceed if APNS token is available
        if (!apnsTokenAvailable) {
          _logger.w('⚠️ APNS token not available after 5 attempts, skipping FCM token registration');
          // Schedule a retry after longer delay
          _scheduleRetry(dio);
          return;
        }
        
        fcmToken = await FirebaseMessaging.instance.getToken();
      } else {
        // Android or other platforms
        fcmToken = await FirebaseMessaging.instance.getToken();
      }

      if (fcmToken != null && !_tokenRegistered) {
        await _sendTokenToServer(dio, fcmToken);
      } else if (fcmToken == null) {
        _logger.w('⚠️ FCM token is null, scheduling retry');
        _scheduleRetry(dio);
      }
    } catch (e) {
      _logger.e('❌ Error getting FCM token: $e');
      // Schedule retry on error
      _scheduleRetry(dio);
    }
  }

  static void _scheduleRetry(Dio dio) {
    _logger.i('🔄 Scheduling FCM token retry in 10 seconds...');
    Future.delayed(const Duration(seconds: 10), () async {
      if (!_tokenRegistered) {
        _logger.i('♻️ Retrying FCM token registration');
        await _getAndRegisterToken(dio);
      }
    });
  }

  static Future<void> _sendTokenToServer(Dio dio, String fcmToken) async {
    try {
      _logger.i('📬 Sending FCM token to server: ${fcmToken.substring(0, 20)}...');
      
      // Fixed: Use correct API endpoint
      await dio.post(
        '/users/fcm-token',  // Changed from '/users/fcm-token'
        data: {'token': fcmToken},
      );
      _tokenRegistered = true;
      _logger.i('✅ FCM token registered successfully');
    } catch (e) {
      _logger.e('❌ Error sending FCM token to server: $e');
      // Don't mark as registered on error, allow retry
    }
  }

  // Method to reset registration status (useful for logout/login)
  static void resetRegistrationStatus() {
    _tokenRegistered = false;
    _isInitialized = false;
    _logger.i('🔄 FCM token registration status reset');
  }

  // Method to check if user is authenticated before sending token
  static bool _isUserAuthenticated(Dio dio) {
    // Check if dio has authorization header or token
    final headers = dio.options.headers;
    return headers.containsKey('Authorization') || headers.containsKey('authorization');
  }
}

// Updated login service - removed FCM initialization from here
Future<void> loginService(BuildContext context, WidgetRef ref) async {
  _logger.i('✅ Google Sign-In button pressed');
  try {
    final dio = ref.read(dioProvider);
    _logger.i('✅ Dio instance created');

    final googleSignIn = GoogleSignIn(
      clientId: dotenv.env['GOOGLE_WEB_CLIENT_ID'],
    );

    final googleUser = await googleSignIn.signIn();
    if (googleUser == null) {
      _logger.w('❌ Google Sign-In cancelled by user');
      return;
    }

    final googleAuth = await googleUser.authentication;

    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    final firebaseUser = await FirebaseAuth.instance.signInWithCredential(credential);
    final firebaseIdToken = await firebaseUser.user!.getIdToken();

    final response = await dio.post(
      '/auth/mobile-auth',
      data: {'idToken': firebaseIdToken},
    );

    final token = response.data['token'];
    final userJson = response.data['user'];

    if (token != null && userJson != null) {
      ref.read(tokenProvider.notifier).setToken(token);
      final user = AppUser.fromJson(userJson);
      ref.read(userProvider.notifier).setUser(user);
      _logger.i('✅ User logged in and token stored');
      
      if (!context.mounted) return;
      Navigator.pushReplacementNamed(context, '/');
    } else {
      throw Exception('Missing token or user in response');
    }
  } catch (e) {
    _logger.e('❌ Error signing in: ${e.toString()}');

    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Error signing in: ${e.toString()}')),
    );
  }
}

Future<void> logoutService(BuildContext context, WidgetRef ref) async {
  _logger.i('✅ Logout button pressed');

  try {
    // Step 1: Firebase (if used for Google Sign-In)
    await FirebaseAuth.instance.signOut();

    // Step 2: Google Sign-In
    final googleSignIn = GoogleSignIn();
    if (await googleSignIn.isSignedIn()) {
      await googleSignIn.signOut();
    }

    // Step 3: Clear custom token & user data
    await ref.read(tokenProvider.notifier).clearToken();
    await ref.read(userProvider.notifier).clearUser();

    // Step 4: Reset FCM registration status
    FCMTokenService.resetRegistrationStatus();

    _logger.i('🧹 Cleared all stored user data and token');

    // Step 5: Navigate to login
    if (!context.mounted) return;
    Navigator.pushReplacementNamed(context, '/login');
  } catch (e) {
    _logger.e('❌ Error logging out: ${e.toString()}');

    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Error logging out: ${e.toString()}')),
    );
  }
}