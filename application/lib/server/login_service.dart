import 'package:application/auth/auth_repository.dart';
import 'package:application/auth/token_provider.dart';
import 'package:application/server/dio_instance.dart';
import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:firebase_auth/firebase_auth.dart';

final _logger = Logger();

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

    _logger.i('✅ Firebase ID Token acquired');

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
      // final fcmToken = await FirebaseMessaging.instance.getToken();
      // if (fcmToken != null) {
      //   _logger.i('📬 FCM token retrieved: $fcmToken');
      //   await dio.post(
      //     '/users/fcm-token',
      //     data: {
      //       'token': fcmToken,// Make sure this is the MongoDB `_id`
      //     },
      //   );
      //   _logger.i('📬 FCM token sent successfully');
      // } else {
      //   _logger.w('⚠️ No FCM token retrieved');
      // }
      setupFcmToken(dio);
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

    _logger.i('🧹 Cleared all stored user data and token');

    // Step 4: Navigate to login
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


void setupFcmToken(Dio dio) async {
  final messaging = FirebaseMessaging.instance;

  // Listen to token updates
  FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
    _logger.i('📬 [onTokenRefresh] New FCM token: $newToken');
    await dio.post('/users/fcm-token', data: {'token': newToken});
  });

  try {
    final token = await messaging.getToken();

    if (token != null) {
      _logger.i('📬 Initial FCM token: $token');
      await dio.post('/users/fcm-token', data: {'token': token});
    } else {
      _logger.w('⚠️ No FCM token retrieved (yet)');
    }
  } catch (e) {
    _logger.e('❌ Failed to get FCM token: $e');
  }
}
