import 'package:application/pages/event/event_model.dart';
import 'package:application/pages/todo/todo_model.dart';
import 'package:application/server/dio_instance.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';

final _logger = Logger();

final eventProvider = FutureProvider<List<Event>>((ref) async {
  try {
    final dio = ref.watch(dioProvider);
    final res = await dio.get('/events');
    final events = (res.data['events'] as List)
        .map((json) => Event.fromJson(json))
        .toList();
    _logger.i('Fetched ${events.length} events');
    return events;
  } catch (e) {
    _logger.e('Error fetching events: $e');
    rethrow;
  }
});

final singleEventProvider = FutureProvider.family<Event, String>((
  ref,
  id,
) async {
  try {
    final dio = ref.watch(dioProvider);
    final res = await dio.get('/events/$id');
    return Event.fromJson(res.data['event']);
  } catch (e) {
    _logger.e('Error fetching single event with id $e');
    rethrow;
  }
});

final eventNotesProvider = FutureProvider.family<List<Todo>, String>((ref, eventId) async {
  final repo = ref.watch(eventRepositoryProvider);
  return repo.getNotes(eventId);
});


final eventRepositoryProvider = Provider<EventRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return EventRepository(dio);
});

class EventRepository {
  final Dio _dio;
  EventRepository(this._dio);

  Future<List<Event>> getAllEvents() async {
    try {
      final res = await _dio.get('/events');
      return (res.data['events'] as List)
          .map((json) => Event.fromJson(json))
          .toList();
    } catch (e) {
      _logger.e('Error fetching all events: $e');
      rethrow;
    }
  }

  Future<Event> createEvent(EventCreateRequest data) async {
    try {
      final res = await _dio.post('/events', data: data.toJson());
      return Event.fromJson(res.data);
    } catch (e) {
      _logger.e('Error creating event: $e');
      rethrow;
    }
  }

  Future<void> deleteEvent(String id) async {
    try {
      await _dio.delete('/events/$id');
    } catch (e) {
      _logger.e('Error deleting event: $e');
      rethrow;
    }
  }

  Future<Event> updateEvent(String id, EventCreateRequest updatedData) async {
    try {
      final res = await _dio.put('/events/$id', data: updatedData.toJson());
      return Event.fromJson(res.data);
    } catch (e) {
      _logger.e('Error updating event: $e');
      rethrow;
    }
  }

  Future<List<Todo>> getNotes(String id) async {
    try {
      final res = await _dio.get('/events/get-notes?id=$id');
      _logger.i('message: ${res.data['message']}');
      final todos = (res.data['todos'] as List)
          .map((json) => Todo.fromJson(json))
          .toList();
      _logger.i('Fetched ${todos.length} notes for event $id');
      return todos;
    } catch (e) {
      _logger.e('Error fetching notes for event $id: $e');
      rethrow;
    }
  }
}
