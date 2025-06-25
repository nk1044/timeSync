import 'package:application/pages/event/event.dart';
import 'package:flutter/material.dart';
import 'package:application/pages/timetable/time_table.dart';
import 'package:application/pages/todo/todo.dart';

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key});

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _currentIndex = 0;

  static const List<Widget> _pages = [
    TimetablePage(),
    MyEvents(),
    MyTodos(),
  ];

  static const List<String> _titles = ["Timetable", "Events", "Todos"];

  static const List<IconData> _icons = [
    Icons.schedule_rounded,
    Icons.event_rounded,
    Icons.task_alt_rounded,
  ];


  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDarkMode = theme.brightness == Brightness.dark;

    return Scaffold(
      extendBody: true,
      backgroundColor: isDarkMode
          ? const Color(0xFF0A0A0A)
          : const Color(0xFFF8F9FA),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        child: _pages[_currentIndex],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: isDarkMode
              ? Colors.white.withOpacity(0.05)
              : Colors.white.withOpacity(0.9),
          border: Border(
            top: BorderSide(
              color: isDarkMode
                  ? Colors.white.withOpacity(0.1)
                  : Colors.black.withOpacity(0.1),
              width: 1,
            ),
          ),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 60,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(_pages.length, (index) {
                final isSelected = index == _currentIndex;
                return GestureDetector(
                  onTap: () => setState(() => _currentIndex = index),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? theme.colorScheme.primary.withOpacity(0.15)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _icons[index],
                          size: 24,
                          color: isSelected
                              ? theme.colorScheme.primary
                              : (isDarkMode ? Colors.white70 : Colors.black54),
                        ),
                        if (isSelected) ...[
                          const SizedBox(width: 8),
                          Text(
                            _titles[index],
                            style: TextStyle(
                              fontWeight: FontWeight.w500,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}
