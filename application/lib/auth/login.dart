import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:firebase_auth/firebase_auth.dart';

final _logger = Logger();

class MyLoginPage extends StatelessWidget {
  const MyLoginPage({super.key});

  void _handleGoogleSignIn(BuildContext context)async {
    _logger.i('Google Sign-In button pressed');
    try {
      final GoogleSignInAccount? googleUser = await GoogleSignIn().signIn();
      final GoogleSignInAuthentication? googleAuth = await googleUser?.authentication;
      final credentialsUser = await GoogleAuthProvider.credential(
        accessToken: googleAuth?.accessToken,
        idToken: googleAuth?.idToken,
      );
      _logger.i('Google Sign-In successful: ${googleUser?.email}');
      _logger.i('Access Token: ${googleAuth?.accessToken}');
      _logger.i('ID Token: ${googleAuth?.idToken}');
    } catch (e) {
      _logger.e('Error during Google Sign-In: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error signing in: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Center(
        child: ElevatedButton.icon(
          onPressed: () => _handleGoogleSignIn(context),
          icon: const Icon(Icons.login),
          label: const Text('Sign in with Google'),
        ),
      ),
    );
  }
}
