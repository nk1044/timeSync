import 'package:application/auth/auth_gate.dart';
import 'package:application/auth/login.dart';
import 'package:application/home/home_page.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'firebase_options.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:logger/logger.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

final _logger = Logger();

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  _logger.i('🔔 Background message: ${message.messageId}');
}

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

Future<void> setupFlutterNotifications() async {
  const androidSettings = AndroidInitializationSettings('ic_notification');
  const initSettings = InitializationSettings(android: androidSettings);
  await flutterLocalNotificationsPlugin.initialize(initSettings);
}

Future<void> showFlutterNotification(RemoteMessage message) async {
  const androidDetails = AndroidNotificationDetails(
    'default_channel',
    'Default',
    channelDescription: 'Default notification channel',
    importance: Importance.max,
    priority: Priority.high,
    showWhen: true,
  );

  const notificationDetails = NotificationDetails(android: androidDetails);

  await flutterLocalNotificationsPlugin.show(
    message.hashCode,
    message.notification?.title,
    message.notification?.body,
    notificationDetails,
  );
}

void main() async {
  try {
    WidgetsFlutterBinding.ensureInitialized();
    await dotenv.load();
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    await setupFlutterNotifications();
    
    // Set up Firebase Messaging
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    FirebaseMessaging.onMessage.listen((message) {
      _logger.i('📥 Foreground message: ${message.notification?.title}');
      showFlutterNotification(message);
    });
    
    // Request permissions only
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );
    
    _logger.i('✅ Firebase initialized successfully');
    
    runApp(const ProviderScope(child: MyApp()));
  } catch (e) {
    _logger.e("❌ Failed to initialize app: $e");
    runApp(const ProviderScope(child: MyApp()));
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Firebase App',
      debugShowCheckedModeBanner: false,
      initialRoute: '/',
      routes: {
        '/': (context) => const AuthGate(child: MyHomePage()),
        '/login': (context) => const MyLoginPage(),
      },
    );
  }
}