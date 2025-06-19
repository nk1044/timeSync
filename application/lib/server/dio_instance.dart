import 'package:application/auth/token_provider.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';


final dioProvider = Provider<Dio>((ref) {
  final token = ref.watch(tokenProvider);

  final mydio = Dio(BaseOptions(
    baseUrl: 'http://localhost:3000/api',
    headers: {
      if (token != null) 'Authorization': 'Bearer $token',
    },
  ));

  // Add interceptors if needed
  mydio.interceptors.add(LogInterceptor(responseBody: true));
  return mydio;
});
