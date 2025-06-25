import 'package:application/pages/timetable/timetable_provider.dart';
import 'package:application/pages/user/settings.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'dart:async';
import 'package:rxdart/rxdart.dart';


// Provider for selected date
final selectedDateProvider = StateProvider<DateTime>((ref) => DateTime.now());

// Provider for current time (updates every minute)
final currentTimeProvider = StreamProvider<DateTime>((ref) {
  return Stream.periodic(const Duration(seconds: 30), (_) => DateTime.now())
      .startWith(DateTime.now());
});


// Provider for fetching events
final eventsProvider = FutureProvider.family<List<EventItem>, DateTime>((ref, date) {
  final repository = ref.watch(timetableRepositoryProvider);
  return repository.getAllEvents(date);
});

class TimetablePage extends ConsumerStatefulWidget {
  const TimetablePage({Key? key}) : super(key: key);

  @override
  ConsumerState<TimetablePage> createState() => _TimetablePageState();
}

class _TimetablePageState extends ConsumerState<TimetablePage> {
  final ScrollController _scrollController = ScrollController();
  Timer? _scrollTimer;
  DateTime? _lastScrollTime;
  final double hourHeight = 80.0; // Height of each hour slot

  @override
  void initState() {
    super.initState();
    // Auto-scroll to current time after a delay
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Add a small delay to ensure the widget is fully built
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          _scrollToCurrentTime();
        }
      });
    });
  }

  @override
  void dispose() {
    _scrollTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToCurrentTime() {
    final now = DateTime.now();
    final currentHour = now.hour;
    final currentMinute = now.minute;
    
    // Calculate position (each hour is 80 pixels)
    final position = (currentHour * hourHeight) + (currentMinute * hourHeight / 60.0);
    
    if (_scrollController.hasClients) {
      // Get screen height to center the indicator
      final screenHeight = MediaQuery.of(context).size.height;
      final offset = screenHeight / 3; // Show indicator in upper third of screen
      
      _scrollController.animateTo(
        (position - offset).clamp(0.0, _scrollController.position.maxScrollExtent),
        duration: const Duration(milliseconds: 1000),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: ref.read(selectedDateProvider),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme.copyWith(
              primary: Colors.blue,
            ),
          ),
          child: child!,
        );
      },
    );
    
    if (picked != null) {
      ref.read(selectedDateProvider.notifier).state = picked;
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedDate = ref.watch(selectedDateProvider);
    final eventsAsync = ref.watch(eventsProvider(selectedDate));
    final currentTimeAsync = ref.watch(currentTimeProvider);

    // Auto-scroll when time changes (only for today)
    currentTimeAsync.whenData((currentTime) {
      if (_isToday(selectedDate) && _lastScrollTime != null) {
        final hourDifference = currentTime.hour - _lastScrollTime!.hour;
        if (hourDifference.abs() >= 1) {
          // Hour has changed, scroll to new position
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              _scrollToCurrentTime();
            }
          });
        }
      }
      _lastScrollTime = currentTime;
    });

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        toolbarHeight: kToolbarHeight,
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            // Left: Settings Button
            IconButton(
              icon: const Icon(Icons.settings),
              tooltip: 'Settings',
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => const MySettings(),
                    fullscreenDialog: true,
                  ),
                );
              },
            ),

            // Middle: Title
            Expanded(
              child: Center(
                child: Text(
                  'Timetable',
                  style: Theme.of(context).appBarTheme.titleTextStyle,
                ),
              ),
            ),
            IconButton(
              onPressed: _scrollToCurrentTime,
              icon: const Icon(Icons.schedule),
              tooltip: 'Go to Current Time',
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Date Header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: () => _selectDate(context),
                  child: Row(
                    children: [
                      Text(
                        DateFormat('EEEE, MMMM d, yyyy').format(selectedDate),
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.keyboard_arrow_down,
                        color: Colors.grey[600],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _isToday(selectedDate) ? 'Today' : _getDayDifference(selectedDate),
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          
          // Timetable View
          Expanded(
            child: eventsAsync.when(
              data: (events) => _buildTimetableView(events, currentTimeAsync, selectedDate),
              loading: () => const Center(
                child: CircularProgressIndicator(),
              ),
              error: (error, stack) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      color: Colors.red[300],
                      size: 48,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Failed to load events',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: () {
                        ref.invalidate(eventsProvider(selectedDate));
                      },
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimetableView(List<EventItem> events, AsyncValue<DateTime> currentTimeAsync, DateTime selectedDate) {
    return Stack(
      children: [
        // Main timetable
        SingleChildScrollView(
          controller: _scrollController,
          child: Container(
            // margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Stack(
              children: [
                // Hour slots (background grid)
                Column(
                  children: List.generate(24, (hour) {
                    return _buildHourSlot(hour);
                  }),
                ),
                // Events overlay
                ..._buildEventOverlays(events),
              ],
            ),
          ),
        ),
        
        // Current time indicator (always show, but only animate for today)
        currentTimeAsync.when(
          data: (currentTime) => _buildTimeIndicator(currentTime),
          loading: () => const SizedBox.shrink(),
          error: (_, __) => const SizedBox.shrink(),
        ),
      ],
    );
  }

  Widget _buildHourSlot(int hour) {
    final timeString = DateFormat('h:mm a').format(DateTime(2024, 1, 1, hour));
    
    return Container(
      height: hourHeight,
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: Colors.grey[200]!,
            width: hour == 0 ? 0 : 0.5,
          ),
        ),
      ),
      child: Row(
        children: [
          // Time label
          Container(
            width: 70,
            padding: const EdgeInsets.all(12),
            child: Text(
              timeString,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Colors.grey[600],
              ),
            ),
          ),
          
          // Vertical separator
          Container(
            width: 1,
            height: double.infinity,
            color: Colors.grey[200],
          ),
          
          // Empty space for events (will be overlaid)
          const Expanded(child: SizedBox()),
        ],
      ),
    );
  }

  List<Widget> _buildEventOverlays(List<EventItem> events) {
    return events.map((event) => _buildEventOverlay(event)).toList();
  }

  Widget _buildEventOverlay(EventItem eventItem) {
    final startTime = _parseTimeToMinutes(eventItem.startTime);
    final endTime = _parseTimeToMinutes(eventItem.endTime);
    
    // Calculate position and height
    final topPosition = (startTime / 60.0) * hourHeight;
    final eventHeight = ((endTime - startTime) / 60.0) * hourHeight;
    
    final colors = _getEventColors(eventItem.event.tag);
    
    return Positioned(
      top: topPosition,
      left: 71, // Start after time label and separator
      right: 0,
      height: eventHeight,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: colors['background'],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: colors['border']!,
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              eventItem.event.title,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: colors['text'],
              ),
              maxLines: eventHeight > 40 ? 2 : 1,
              overflow: TextOverflow.ellipsis,
            ),
            if (eventHeight > 40) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: colors['tag'],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      eventItem.event.tag,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                        color: colors['tagText'],
                      ),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${eventItem.startTime} - ${eventItem.endTime}',
                    style: TextStyle(
                      fontSize: 10,
                      color: colors['time'],
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTimeIndicator(DateTime currentTime) {
    final hour = currentTime.hour;
    final minute = currentTime.minute;
    final position = (hour * hourHeight) + (minute * hourHeight / 60.0);
    
    return Positioned(
      top: position + 16, // Offset for margin
      left: 16,
      right: 16,
      child: Row(
        children: [
          // Time circle with current time
          Container(
            width: 70,
            alignment: Alignment.center,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.red.withOpacity(0.3),
                        blurRadius: 6,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    DateFormat('HH:mm').format(currentTime),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Animated line
          Expanded(
            child: Container(
              height: 2,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.red,
                    Colors.red.withOpacity(0.3),
                    Colors.transparent,
                  ],
                ),
                borderRadius: BorderRadius.circular(1),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Convert time string to minutes from midnight
  int _parseTimeToMinutes(String timeString) {
    try {
      final parts = timeString.split(':');
      final hours = int.parse(parts[0]);
      final minutes = int.parse(parts[1]);
      return hours * 60 + minutes;
    } catch (e) {
      return 0;
    }
  }

  Map<String, Color> _getEventColors(String tag) {
    final colors = {
      'CLASS': {
        'background': Colors.blue[50]!,
        'border': Colors.blue[200]!,
        'text': Colors.blue[800]!,
        'tag': Colors.blue[100]!,
        'tagText': Colors.blue[700]!,
        'time': Colors.blue[600]!,
      },
      'PERSONAL': {
        'background': Colors.green[50]!,
        'border': Colors.green[200]!,
        'text': Colors.green[800]!,
        'tag': Colors.green[100]!,
        'tagText': Colors.green[700]!,
        'time': Colors.green[600]!,
      }
    };
    
    return colors[tag] ?? colors['PERSONAL']!;
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year && 
           date.month == now.month && 
           date.day == now.day;
  }

  String _getDayDifference(DateTime date) {
    final now = DateTime.now();
    final difference = date.difference(DateTime(now.year, now.month, now.day)).inDays;
    
    if (difference == 1) return 'Tomorrow';
    if (difference == -1) return 'Yesterday';
    if (difference > 1) return 'In $difference days';
    if (difference < -1) return '${difference.abs()} days ago';
    
    return 'Today';
  }
}