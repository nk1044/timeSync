class Event {
  final String id;
  final String title;
  final String description;
  final String message;
  final DateTime updatedAt;
  final DateTime createdAt;

  Event({
    required this.id,
    required this.title,
    required this.description,
    required this.message,
    required this.createdAt,
    required this.updatedAt,
  });

  @override
  String toString() {
    return 'Event(title: $title, description: $description, location: $message)';
  }

  factory Event.fromJson(Map<String, dynamic> json) => Event(
        id: json['_id'],
        title: json['title'],
        description: json['description'] ?? '',
        message: json['message'] ?? '',
        updatedAt: DateTime.parse(json['updatedAt']),
        createdAt: DateTime.parse(json['createdAt']),
      );
  Map<String, dynamic> toJson() => {
        '_id': id,
        'title': title,
        'description': description,
        'message': message,
        'updatedAt': updatedAt.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
      };
}

class EventCreateRequest {
  final String title;
  final String description;
  final String message;

  EventCreateRequest({
    required this.title,
    required this.description,
    required this.message,
  });

  Map<String, dynamic> toJson() => {
    'title': title,
    'description': description,
    'message': message,
  };
}

