import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:application/auth/login.dart';
import 'package:application/auth/auth_validation_provider.dart';
import 'package:application/server/dio_instance.dart';
import 'package:application/server/login_service.dart'; // For FCMTokenService
import 'package:logger/logger.dart';

final _logger = Logger();

class AuthGate extends ConsumerStatefulWidget {
  final Widget child;

  const AuthGate({Key? key, required this.child}) : super(key: key);

  @override
  ConsumerState<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends ConsumerState<AuthGate> {
  bool _fcmInitialized = false;

  @override
  Widget build(BuildContext context) {
    final authAsync = ref.watch(authValidationProvider);

    return authAsync.when(
      data: (isAuthenticated) {
        _logger.i('🔍 AuthGate checking authentication status: $isAuthenticated');

        if (!isAuthenticated) {
          _logger.i('🔓 User not authenticated, redirecting to login');
          _fcmInitialized = false; // reset on logout
          return const MyLoginPage();
        }

        _logger.i('🔒 User authenticated');
        if (!_fcmInitialized) {
          _initializeFCMForAuthenticatedUser();
        }

        return widget.child;
      },
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (e, stack) {
        _logger.e('❌ AuthGate error: $e');
        return Scaffold(
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error, color: Colors.red, size: 60),
                const SizedBox(height: 16),
                Text(
                  'Error checking authentication.\n$e',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.refresh(authValidationProvider),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _initializeFCMForAuthenticatedUser() async {
    try {
      _fcmInitialized = true;
      final dio = ref.read(dioProvider);

      _logger.i('🚀 Initializing FCM token for authenticated user');

      await FCMTokenService.initializeFCMToken(dio);

      _logger.i('✅ FCM token successfully initialized');
    } catch (e) {
      _logger.e('❌ Error initializing FCM for authenticated user: $e');
      _fcmInitialized = false; // allow retry on next build
    }
  }
}
