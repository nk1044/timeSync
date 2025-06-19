import 'package:application/auth/login.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'firebase_options.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:logger/logger.dart';

final _logger = Logger();

void main() async {
  try {
    await dotenv.load();
  } catch (e) {
    _logger.i("❌ Failed to load .env file: $e");
  }
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Firebase App',
      home: Scaffold(
        appBar: AppBar(title: Text('Firebase Initialization')),
        body: MyLoginPage(),
      ),
    );
  }
}
