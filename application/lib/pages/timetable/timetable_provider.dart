import 'package:application/server/dio_instance.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';

final _logger = Logger();

class Routine {
  final String id;
  final String event;
  final String? eventMessage;
  final DateTime startTime;
  final DateTime endTime;
  final String day;
  final String frequency;
  final String owner;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Routine({
    required this.id,
    required this.event,
    this.eventMessage,
    required this.startTime,
    required this.endTime,
    required this.day,
    required this.frequency,
    required this.owner,
    this.createdAt,
    this.updatedAt,
  });

  factory Routine.fromJson(Map<String, dynamic> json) => Routine(
        id: json['_id'] ?? '',
        event: json['Event'] ?? '',
        eventMessage: json['EventMessage'],
        startTime: DateTime.parse(json['startTime']),
        endTime: DateTime.parse(json['endTime']),
        day: json['Day'] ?? '',
        frequency: json['Frequency'] ?? '',
        owner: json['owner'] ?? '',
        createdAt:
            json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
        updatedAt:
            json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      );

  Map<String, dynamic> toJson() => {
        'Event': event,
        'startTime': startTime.toIso8601String(),
        'endTime': endTime.toIso8601String(),
        'Day': day,
        'Frequency': frequency,
        'owner': owner,
      };
}



class RoutineRepository {
  final Dio _dio;
  RoutineRepository(this._dio);

  Future<List<Routine>> getAllRoutines() async {
    try {
      final res = await _dio.get('/routine');
      final List data = res.data;

      return data.map((r) => Routine.fromJson(r)).toList();
    } catch (e, st) {
      _logger.e('Error in getAllRoutines: $e');
      _logger.e(st);
      rethrow;
    }
  }

  Future<Routine> getRoutineById(String id) async {
    try {
      final res = await _dio.get('/routine/$id');
      return Routine.fromJson(res.data);
    } catch (e, st) {
      _logger.e('Error in getRoutineById: $e');
      _logger.e(st);
      rethrow;
    }
  }

  Future<List<Routine>> getRoutinesByDate(DateTime date) async {
    try {
      final formattedDate = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
      final res = await _dio.get('/routine/date', queryParameters: { 'date': formattedDate });

      final List data = res.data;
      return data.map((r) => Routine.fromJson(r)).toList();
    } catch (e, st) {
      _logger.e('Error in getRoutinesByDate: $e');
      _logger.e(st);
      rethrow;
    }
  }

  Future<void> createRoutine(Routine routine) async {
    try {
      final res = await _dio.post('/routine', data: routine.toJson());
      _logger.i("Routine created: ${res.data}");
    } catch (e, st) {
      _logger.e('Error in createRoutine: $e');
      _logger.e(st);
      rethrow;
    }
  }

  Future<void> deleteRoutine(String id) async {
    try {
      await _dio.delete('/routine/$id');
      _logger.i("Routine $id deleted");
    } catch (e, st) {
      _logger.e('Error in deleteRoutine: $e');
      _logger.e(st);
      rethrow;
    }
  }

  Future<void> updateRoutine(String id, Routine routine) async {
    try {
      await _dio.put('/routine/$id', data: routine.toJson());
      _logger.i("Routine $id updated");
    } catch (e, st) {
      _logger.e('Error in updateRoutine: $e');
      _logger.e(st);
      rethrow;
    }
  }
}


final routineRepositoryProvider = Provider<RoutineRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return RoutineRepository(dio);
});


// class Routine {
//   final String id;
//   final String event;
//   final DateTime startTime;
//   final DateTime endTime;
//   final String day;
//   final String frequency;
//   final String owner;
//   final DateTime createdAt;
//   final DateTime updatedAt;
//   final String eventMessage;

//   Routine({
//     required this.id,
//     required this.event,
//     required this.startTime,
//     required this.endTime,
//     required this.day,
//     required this.frequency,
//     required this.owner,
//     required this.createdAt,
//     required this.updatedAt,
//     required this.eventMessage,
//   });

//   factory Routine.fromJson(Map<String, dynamic> json) {
//     return Routine(
//       id: json['_id'],
//       event: json['Event'],
//       startTime: DateTime.parse(json['startTime']),
//       endTime: DateTime.parse(json['endTime']),
//       day: json['Day'],
//       frequency: json['Frequency'],
//       owner: json['owner'],
//       createdAt: DateTime.parse(json['createdAt']),
//       updatedAt: DateTime.parse(json['updatedAt']),
//       eventMessage: json['eventMessage'],
//     );
//   }
// }