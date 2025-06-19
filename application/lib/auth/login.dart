import 'dart:ui';
import 'package:application/server/login_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';

final _logger = Logger();
final loginLoadingProvider = StateProvider<bool>((ref) => false);

class MyLoginPage extends ConsumerWidget {
  const MyLoginPage({super.key});

  Future<void> _handleGoogleSignIn(BuildContext context, WidgetRef ref) async {
    final loading = ref.read(loginLoadingProvider.notifier);

    try {
      loading.state = true;
      await loginService(context, ref); // already has context.mounted check inside
      _logger.i('✅ Google logged in END');
    } catch (e) {
      _logger.e('❌ Error during Google Sign-In: $e');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error signing in: ${e.toString()}')),
        );
      }
    } finally {
      loading.state = false;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoading = ref.watch(loginLoadingProvider);

    return Scaffold(
      body: Stack(
        children: [
          // Background gradient
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFFe0eafc), Color(0xFFcfdef3)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),

          // Frosted glass content
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 20.0, sigmaY: 20.0),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.2),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 10,
                          spreadRadius: 2,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Avatar Icon
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: const Color.fromARGB(255, 102, 175, 209)
                                .withOpacity(0.2),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: const Color.fromARGB(255, 169, 225, 237)
                                  .withOpacity(0.3),
                            ),
                          ),
                          child: const Icon(
                            Icons.account_circle_outlined,
                            size: 64,
                            color: Color(0xFF4285F4),
                          ),
                        ),
                        const SizedBox(height: 32),

                        const Text(
                          'Welcome Back',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Sign in to continue to your account',
                          style: TextStyle(
                            fontSize: 16,
                            color: Color.fromARGB(153, 84, 84, 84),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 48),

                        // Google Sign In Button
                        ElevatedButton(
                          onPressed: isLoading
                              ? null
                              : () => _handleGoogleSignIn(context, ref),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white.withOpacity(0.9),
                            foregroundColor: Colors.black87,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(
                                vertical: 16, horizontal: 24),
                          ),
                          child: isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.black54,
                                  ),
                                )
                              : Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Image.network(
                                      'https://developers.google.com/identity/images/g-logo.png',
                                      width: 24,
                                      height: 24,
                                    ),
                                    const SizedBox(width: 16),
                                    const Text(
                                      'Continue with Google',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                        ),

                        const SizedBox(height: 32),
                        const Text(
                          'By continuing, you agree to our Terms of Service\nand Privacy Policy',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color.fromARGB(153, 84, 84, 84),
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
