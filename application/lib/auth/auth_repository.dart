import 'package:flutter_riverpod/flutter_riverpod.dart';

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

class UserNotifier extends StateNotifier<AppUser?> {
  UserNotifier() : super(null);

  void setUser(AppUser user) {
    state = user;
  }

  void clearUser() {
    state = null;
  }
}

final userProvider = StateNotifierProvider<UserNotifier, AppUser?>((ref) {
  return UserNotifier();
});
