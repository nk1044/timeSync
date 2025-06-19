class Todo {
  final String id;
  final String title;
  final String description;
  final String status;
  final DateTime? reminder;
  final String tag;
  final DateTime updatedAt;
  final DateTime createdAt;

  Todo({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.reminder,
    required this.tag,
    required this.updatedAt,
    required this.createdAt,
  });

  factory Todo.fromJson(Map<String, dynamic> json) => Todo(
        id: json['_id'],
        title: json['title'],
        description: json['description'] ?? '',
        status: json['status'],
        reminder: json['reminder'] != null ? DateTime.parse(json['reminder']) : null,
        tag: json['tag'],
        updatedAt: DateTime.parse(json['updatedAt']),
        createdAt: DateTime.parse(json['createdAt']),
      );

  Map<String, dynamic> toJson() => {
        '_id': id,
        'title': title,
        'description': description,
        'status': status,
        'reminder': reminder?.toIso8601String(),
        'tag': tag,
        'updatedAt': updatedAt.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
      };
}

class TodoCreateRequest {
  final String title;
  final String description;
  final String status;
  final DateTime? reminder;
  final String tag;

  TodoCreateRequest({
    required this.title,
    required this.description,
    required this.status,
    this.reminder,
    required this.tag,
  });

  Map<String, dynamic> toJson() => {
        'title': title,
        'description': description,
        'status': status,
        'reminder': reminder?.toIso8601String(),
        'tag': tag,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };
}


enum TodoStatus { EVENT, PERSONAL, TASK }
enum TodoTag { IMPORTANT, NOT_IMPORTANT }

String statusToString(TodoStatus status) => status.name;
String tagToString(TodoTag tag) => tag.name;
