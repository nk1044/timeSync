class Event {
  final String id;
  final String title;
  final String description;
  final String tag;
  final String message;
  final DateTime updatedAt;
  final DateTime createdAt;

  Event({
    required this.id,
    required this.title,
    required this.description,
    required this.tag,
    required this.message,
    required this.createdAt,
    required this.updatedAt,
  });

  @override
  String toString() {
    return 'Event(title: $title, description: $description, date: $tag, location: $message)';
  }

  factory Event.fromJson(Map<String, dynamic> json) => Event(
        id: json['_id'],
        title: json['title'],
        description: json['description'] ?? '',
        tag: json['tag'],
        message: json['message'] ?? '',
        updatedAt: DateTime.parse(json['updatedAt']),
        createdAt: DateTime.parse(json['createdAt']),
      );
  Map<String, dynamic> toJson() => {
        '_id': id,
        'title': title,
        'description': description,
        'tag': tag,
        'message': message,
        'updatedAt': updatedAt.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
      };
}

class EventCreateRequest {
  final String title;
  final String description;
  final EventTag tag; // ✅ Change this from DateTime to EventTag
  final String message;

  EventCreateRequest({
    required this.title,
    required this.description,
    required this.tag,
    required this.message,
  });

  Map<String, dynamic> toJson() => {
    'title': title,
    'description': description,
    'tag': tagToString(tag), // ✅ Convert enum to string like "CLASS"
    'message': message,
  };
}


enum EventTag { CLASS, PERSONAL }

String tagToString(EventTag tag) => tag.name;
