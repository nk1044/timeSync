import 'package:application/auth/auth_repository.dart';
import 'package:application/auth/token_provider.dart';
import 'package:application/server/dio_instance.dart';
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
      ref.read(userProvider.notifier).setUser(AppUser.fromJson(userJson));
      _logger.i('✅ User logged in and token stored');
      if (!context.mounted) return;
      Navigator.pushReplacementNamed(context, '/');
    } else {
      throw Exception('Missing token or user in response');
    }
  } catch (e) {
    _logger.e('❌ Error during Google Sign-In: $e');

    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Error signing in: ${e.toString()}')),
    );
  }
}


Future<void> logoutService(BuildContext context, WidgetRef ref) async {
  _logger.i('✅ Logout button pressed');
  try {
    await FirebaseAuth.instance.signOut();
    await ref.read(tokenProvider.notifier).clearToken();
    await ref.read(userProvider.notifier).clearUser();

    final googleSignIn = GoogleSignIn();
    await googleSignIn.signOut();

    _logger.i('✅ User logged out successfully');

    if (!context.mounted) return;
    Navigator.pushReplacementNamed(context, '/login');
  } catch (e) {
    _logger.e('❌ Error during logout: $e');

    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Error logging out: ${e.toString()}')),
    );
  }
}