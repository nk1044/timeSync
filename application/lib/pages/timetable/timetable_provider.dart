import 'package:application/server/dio_instance.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';

final _logger = Logger();

class Event {
  final String id;
  final String title;
  final String description;
  final String tag;
  final String message;
  final DateTime? updatedAt; // Made nullable
  final DateTime? createdAt; // Made nullable

  Event({
    required this.id,
    required this.title,
    required this.description,
    required this.tag,
    required this.message,
    this.createdAt, // Optional
    this.updatedAt, // Optional
  });

  @override
  String toString() {
    return 'Event(title: $title, description: $description, tag: $tag, message: $message)';
  }

  factory Event.fromJson(Map<String, dynamic> json) => Event(
        id: json['_id'] ?? '',
        title: json['title'] ?? '',
        description: json['description'] ?? '',
        tag: json['tag'] ?? '',
        message: json['message'] ?? '',
        // Handle nullable dates - only parse if not null
        updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
        createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      );

  Map<String, dynamic> toJson() => {
        '_id': id,
        'title': title,
        'description': description,
        'tag': tag,
        'message': message,
        if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
        if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      };
}

class EventItem {
  final Event event;
  final String startTime;
  final String endTime;
  final int reminderTime;
  final String? id; // Add id field from JSON

  EventItem({
    required this.event,
    required this.startTime,
    required this.endTime,
    required this.reminderTime,
    this.id,
  });

  factory EventItem.fromJson(Map<String, dynamic> json) {
    return EventItem(
      event: Event.fromJson(json['event'] ?? {}),
      startTime: json['startTime'] ?? '',
      endTime: json['endTime'] ?? '',
      reminderTime: json['reminderTime'] ?? 0,
      id: json['_id'], // Get the EventItem's own ID
    );
  }

  Map<String, dynamic> toJson() => {
        'event': event.toJson(),
        'startTime': startTime,
        'endTime': endTime,
        'reminderTime': reminderTime,
        if (id != null) '_id': id,
      };
}

class TimeTable {
  final String? id; // Add id field
  final String name;
  final DateTime date;
  final String? owner; // Add owner field
  final List<EventItem> events;
  final DateTime? createdAt; // Add createdAt
  final DateTime? updatedAt; // Add updatedAt

  TimeTable({
    this.id,
    required this.name,
    required this.date,
    this.owner,
    required this.events,
    this.createdAt,
    this.updatedAt,
  });

  factory TimeTable.fromJson(Map<String, dynamic> json) {
    return TimeTable(
      id: json['_id'],
      name: json['name'] ?? '',
      date: DateTime.parse(json['date'] ?? DateTime.now().toIso8601String()),
      owner: json['owner'],
      events: (json['events'] as List? ?? [])
          .map((eventJson) => EventItem.fromJson(eventJson ?? {}))
          .toList(),
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
        if (id != null) '_id': id,
        'name': name,
        'date': date.toIso8601String(),
        if (owner != null) 'owner': owner,
        'events': events.map((e) => e.toJson()).toList(),
        if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
        if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      };
}

class TimetableRepository {
  final Dio _dio;
  TimetableRepository(this._dio);

  Future<List<EventItem>> getAllEvents(DateTime date) async {
    try {
      // Format date as YYYY-MM-DD for the API
      final formattedDate = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
      final res = await _dio.get('/days?date=$formattedDate');
      
      if (res.statusCode == 200) {
        _logger.i('API Response: ${res.data}');
        
        final dayData = res.data['day'];
        if (dayData == null) {
          _logger.w('No day data found in response');
          return [];
        }
        
        final timetable = TimeTable.fromJson(dayData);
        _logger.i('Fetched ${timetable.events.length} events for date $formattedDate');
        return timetable.events;
      } else {
        _logger.w('Failed to fetch events: ${res.statusMessage}');
        return [];
      }
    } catch (e, stackTrace) {
      _logger.e('Error fetching all events: $e');
      _logger.e('Stack trace: $stackTrace');
      rethrow;
    }
  }
}

final timetableRepositoryProvider = Provider<TimetableRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return TimetableRepository(dio);
});

// Event creation classes
class EventCreateRequest {
  final String title;
  final String description;
  final EventTag tag;
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
        'tag': tagToString(tag),
        'message': message,
      };
}

enum EventTag { CLASS, PERSONAL }

String tagToString(EventTag tag) => tag.name;