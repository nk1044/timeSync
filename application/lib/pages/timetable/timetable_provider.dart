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

  static DateTime _parseTimeString(String timeStr) {
    try {
      // Parse time format like "8:00:AM" or "11:30:PM"
      final cleanTime = timeStr.replaceAll(' ', '').trim();
      final parts = cleanTime.split(':');
      
      if (parts.length < 2) {
        throw FormatException('Invalid time format: $timeStr');
      }
      
      final hourPart = parts[0];
      final minuteAmPmPart = parts[1];
      
      // Extract minutes and AM/PM
      final isAM = parts[2].contains('AM');
      final isPM = parts[2].contains('PM');
      
      if (!isAM && !isPM) {
        throw FormatException('Time must contain AM or PM: $timeStr');
      }
      
      final minuteStr = minuteAmPmPart.replaceAll(RegExp(r'[APap][Mm]'), '').trim();
      
      int hour = int.parse(hourPart);
      int minute = int.parse(minuteStr);
      
      // Convert to 24-hour format
      if (isPM && hour != 12) {
        hour += 12;
      } else if (isAM && hour == 12) {
        hour = 0;
      }
      
      // Create DateTime for today with the parsed time
      final now = DateTime.now();
      return DateTime(now.year, now.month, now.day, hour, minute);
    } catch (e) {
      _logger.e('Error parsing time string: $timeStr - $e');
      final now = DateTime.now();
      return DateTime(now.year, now.month, now.day, 0, 0);
    }
  }

  static String _formatTimeToString(DateTime time) {
    final hour = time.hour;
    final minute = time.minute.toString().padLeft(2, '0');
    
    if (hour == 0) return '12:$minute:AM';
    if (hour < 12) return '$hour:$minute:AM';
    if (hour == 12) return '12:$minute:PM';
    return '${hour - 12}:$minute:PM';
  }

  factory Routine.fromJson(Map<String, dynamic> json) {
    return Routine(
      id: json['_id'] ?? '',
      event: json['Event'] ?? '',
      eventMessage: json['eventMessage'],
      startTime: _parseTimeString(json['startTime'] ?? '12:00:AM'),
      endTime: _parseTimeString(json['endTime'] ?? '12:00:AM'),
      day: json['Day'] ?? '',
      frequency: json['Frequency'] ?? '',
      owner: json['owner'] ?? '',
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'Event': event,
        'eventMessage': eventMessage,
        'startTime': _formatTimeToString(startTime),
        'endTime': _formatTimeToString(endTime),
        'Day': day,
        'Frequency': frequency,
        'owner': owner,
        if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
        if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
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