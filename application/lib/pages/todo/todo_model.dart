class Todo {
  final String id;
  final String title;
  final String description;
  final DateTime? reminder;
  final DateTime updatedAt;
  final DateTime createdAt;

  Todo({
    required this.id,
    required this.title,
    required this.description,
    required this.reminder,
    required this.updatedAt,
    required this.createdAt,
  });

  factory Todo.fromJson(Map<String, dynamic> json) => Todo(
        id: json['_id'],
        title: json['title'],
        description: json['description'] ?? '',
        reminder: json['reminder'] != null ? DateTime.parse(json['reminder']) : null,
        updatedAt: DateTime.parse(json['updatedAt']),
        createdAt: DateTime.parse(json['createdAt']),
      );

  Map<String, dynamic> toJson() => {
        '_id': id,
        'title': title,
        'description': description,
        'reminder': reminder?.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
      };
}

class TodoCreateRequest {
  final String title;
  final String description;
  final DateTime? reminder;

  TodoCreateRequest({
    required this.title,
    required this.description,
    this.reminder,
  });

  Map<String, dynamic> toJson() => {
        'title': title,
        'description': description,
        'reminder': reminder?.toIso8601String(),
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };
}


