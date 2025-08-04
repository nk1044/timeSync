import 'package:application/pages/timetable/timetable_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import 'dart:convert';
import 'package:intl/intl.dart';
import 'package:logger/logger.dart';
import 'package:shared_preferences/shared_preferences.dart';

final logger = Logger();

class TimetablePage extends ConsumerStatefulWidget {
  const TimetablePage({super.key});

  @override
  ConsumerState<TimetablePage> createState() => _TimetablePageState();
}

class _TimetablePageState extends ConsumerState<TimetablePage> {
  final ScrollController _scrollController = ScrollController();
  List<Routine> routines = [];
  bool isLoading = true;
  DateTime selectedDate = DateTime.now();
  Timer? _currentTimeTimer;
  bool _hasScrolledToCurrentTime = false;

  // Constants for layout
  static const double hourHeight = 70.0;
  static const double timeColumnWidth = 70.0;
  static const double eventLeftMargin = 3.0;

  // Local storage keys
  static const String _routinesCacheKey = 'cached_routines';
  static const String _cacheeDateKey = 'cached_date';

  @override
  void initState() {
    super.initState();
    _loadRoutines();
    _startCurrentTimeTimer();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _currentTimeTimer?.cancel();
    super.dispose();
  }

  void _startCurrentTimeTimer() {
    _currentTimeTimer = Timer.periodic(const Duration(minutes: 1), (timer) {
      if (mounted) setState(() {});
    });
  }

  Future<void> _loadRoutines({bool forceRefresh = false}) async {
    setState(() => isLoading = true);
    
    try {
      List<Routine> loadedRoutines = [];
      
      if (!forceRefresh) {
        // Try to load from cache first
        loadedRoutines = await _loadFromCache();
      }
      
      if (loadedRoutines.isEmpty || forceRefresh) {
        // Load from API if cache is empty or force refresh
        loadedRoutines = await ref
            .read(routineRepositoryProvider)
            .getRoutinesByDate(selectedDate);
        
        // Cache the routines
        await _saveToCache(loadedRoutines);
      }
      
      setState(() {
        routines = loadedRoutines;
        isLoading = false;
      });

      // Schedule scroll to current time after UI is built
      _scheduleScrollToCurrentTime();
      
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading routines: $e'))
        );
      }
    }
  }

  Future<List<Routine>> _loadFromCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedDate = prefs.getString(_cacheeDateKey);
      final todayString = DateFormat('yyyy-MM-dd').format(DateTime.now());
      
      // Only use cache if it's for today's date
      if (cachedDate == todayString) {
        final cachedData = prefs.getString(_routinesCacheKey);
        if (cachedData != null) {
          final List<dynamic> jsonList = json.decode(cachedData);
          return jsonList.map((json) => Routine.fromJson(json)).toList();
        }
      }
    } catch (e) {
      logger.i('Error loading from cache: $e');
    }
    return [];
  }

  Future<void> _saveToCache(List<Routine> routines) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final todayString = DateFormat('yyyy-MM-dd').format(DateTime.now());
      final jsonString = json.encode(routines.map((r) => r.toJson()).toList());
      
      await prefs.setString(_routinesCacheKey, jsonString);
      await prefs.setString(_cacheeDateKey, todayString);
    } catch (e) {
      print('Error saving to cache: $e');
    }
  }

  void _scheduleScrollToCurrentTime() {
    if (!_hasScrolledToCurrentTime) {
      // Use multiple approaches to ensure scrolling happens
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollToCurrentTime();
      });
      
      // Also schedule a delayed scroll as a fallback
      Timer(const Duration(milliseconds: 100), () {
        if (mounted && !_hasScrolledToCurrentTime) {
          _scrollToCurrentTime();
        }
      });
    }
  }

  Future<void> _pickDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (picked != null && picked != selectedDate) {
      setState(() {
        selectedDate = picked;
        _hasScrolledToCurrentTime = false; // Reset scroll flag for new date
      });
      _loadRoutines(forceRefresh: true); // Force refresh for different dates
    }
  }

  void _scrollToCurrentTime() {
    if (!_scrollController.hasClients || _hasScrolledToCurrentTime) return;

    final now = DateTime.now();
    final currentHour = now.hour;
    final currentMinute = now.minute;

    // Calculate position to center current time
    final currentTimePosition =
        (currentHour * hourHeight) + (currentMinute / 60 * hourHeight);
    final screenHeight = MediaQuery.of(context).size.height;
    final appBarHeight =
        AppBar().preferredSize.height + MediaQuery.of(context).padding.top;
    final dateHeaderHeight = 64.0; // Approximate height of date header
    final availableHeight = screenHeight - appBarHeight - dateHeaderHeight;
    final centerOffset = availableHeight / 2;

    final scrollPosition = (currentTimePosition - centerOffset).clamp(
      0.0,
      _scrollController.position.maxScrollExtent,
    );

    _scrollController.animateTo(
      scrollPosition,
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeOut,
    ).then((_) {
      _hasScrolledToCurrentTime = true;
    });
  }

  void _forceRefresh() {
    setState(() {
      _hasScrolledToCurrentTime = false;
    });
    _loadRoutines(forceRefresh: true);
  }

  List<List<Routine>> _groupOverlappingEvents() {
    List<List<Routine>> groups = [];
    List<Routine> sortedRoutines = List.from(routines)
      ..sort((a, b) => a.startTime.compareTo(b.startTime));

    for (Routine routine in sortedRoutines) {
      bool addedToGroup = false;

      for (List<Routine> group in groups) {
        bool overlaps = group.any(
          (r) =>
              routine.startTime.isBefore(r.endTime) &&
              routine.endTime.isAfter(r.startTime),
        );

        if (overlaps) {
          group.add(routine);
          addedToGroup = true;
          break;
        }
      }

      if (!addedToGroup) {
        groups.add([routine]);
      }
    }

    return groups;
  }

  double _getMinutesFromMidnight(DateTime time) {
    return time.hour * 60.0 + time.minute;
  }

  Widget _buildTimeColumn() {
    return Container(
      width: timeColumnWidth,
      child: Column(
        children: List.generate(24, (hour) {
          final time = hour == 0
              ? '12 AM'
              : hour < 12
              ? '$hour AM'
              : hour == 12
              ? '12 PM'
              : '${hour - 12} PM';

          return Container(
            height: hourHeight,
            alignment: Alignment.topRight,
            padding: const EdgeInsets.only(right: 8, top: 2),
            child: Text(
              time,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildEventArea() {
    final overlappingGroups = _groupOverlappingEvents();

    return Expanded(
      child: Stack(
        children: [
          // Hour lines
          ...List.generate(24, (hour) {
            return Positioned(
              top: hour * hourHeight,
              left: 0,
              right: 0,
              child: Container(height: 1, color: Colors.grey[300]),
            );
          }),

          // Half-hour lines
          ...List.generate(24, (hour) {
            return Positioned(
              top: hour * hourHeight + hourHeight / 2,
              left: 0,
              right: 0,
              child: Container(height: 0.5, color: Colors.grey[200]),
            );
          }),

          // Events
          ...overlappingGroups.expand((group) {
            return group.asMap().entries.map((entry) {
              final index = entry.key;
              final routine = entry.value;
              final groupSize = group.length;

              final startMinutes = _getMinutesFromMidnight(routine.startTime);
              final endMinutes = _getMinutesFromMidnight(routine.endTime);
              final durationMinutes = endMinutes - startMinutes;

              final top = (startMinutes / 60) * hourHeight;
              final height = (durationMinutes / 60) * hourHeight;

              // Calculate width and left position for overlapping events
              final eventWidth = groupSize > 1
                  ? ((MediaQuery.of(context).size.width -
                                timeColumnWidth -
                                eventLeftMargin * 2) /
                            groupSize) -
                        2
                  : MediaQuery.of(context).size.width -
                        timeColumnWidth -
                        eventLeftMargin * 2;

              final left = eventLeftMargin + (index * (eventWidth + 2));

              return Positioned(
                top: top,
                left: left,
                width: eventWidth,
                height: height,
                child: _buildEventCard(routine, groupSize > 1),
              );
            });
          }),

          // Current time indicator
          _buildCurrentTimeIndicator(),
        ],
      ),
    );
  }

  Widget _buildEventCard(Routine routine, bool isOverlapping) {
    final colors = [
      Colors.blue,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.teal,
      Colors.indigo,
    ];

    final color = colors[routine.id.hashCode % colors.length];
    final overlappingColor = isOverlapping ? color.withOpacity(0.8) : color;

    return Container(
      margin: const EdgeInsets.fromLTRB(2, 2, 5, 2),
      decoration: BoxDecoration(
        color: overlappingColor.withOpacity(0.2),
        border: Border.all(color: overlappingColor, width: 2),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              routine.event,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12,
                color: overlappingColor.withOpacity(0.9),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            if (routine.eventMessage != null) ...[
              const SizedBox(height: 2),
              Flexible(
                child: Text(
                  routine.eventMessage!,
                  style: TextStyle(fontSize: 10, color: Colors.grey[700]),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
            const SizedBox(height: 2),
            Text(
              '${_formatTime(routine.startTime)} - ${_formatTime(routine.endTime)}',
              style: TextStyle(
                fontSize: 10,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentTimeIndicator() {
    final now = DateTime.now();
    final currentMinutes = _getMinutesFromMidnight(now);
    final top = (currentMinutes / 60) * hourHeight;

    return Positioned(
      top: top,
      left: 0,
      right: 0,
      child: Row(
        children: [
          Container(
            width: timeColumnWidth - 10,
            alignment: Alignment.centerRight,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _formatTime(now),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          Expanded(child: Container(height: 2, color: Colors.red)),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final hour = time.hour;
    final minute = time.minute.toString().padLeft(2, '0');

    if (hour == 0) return '12:$minute AM';
    if (hour < 12) return '$hour:$minute AM';
    if (hour == 12) return '12:$minute PM';
    return '${hour - 12}:$minute PM';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.today),
          onPressed: () {
            setState(() {
              _hasScrolledToCurrentTime = false;
            });
            _scrollToCurrentTime();
          },
          tooltip: 'Go to current time',
        ),
        title: Stack(
          alignment: Alignment.center,
          children: [const Text('Timetable')],
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _forceRefresh,
            tooltip: 'Refresh',
          ),
        ],
      ),

      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Date header
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      GestureDetector(
                        onTap: _pickDate,
                        child: Row(
                          children: [
                            Icon(
                              Icons.calendar_today,
                              size: 18,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              DateFormat('EEEE, MMMM d').format(
                                selectedDate,
                              ),
                              style: Theme.of(context).textTheme.titleLarge
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Calendar content
                Expanded(
                  child: SingleChildScrollView(
                    controller: _scrollController,
                    child: SizedBox(
                      height: 24 * hourHeight,
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [_buildTimeColumn(), _buildEventArea()],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 100)
              ],
            ),
    );
  }
}