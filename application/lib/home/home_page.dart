import 'package:application/pages/event/event.dart';
import 'package:application/pages/timetable/time_table.dart';
import 'package:application/pages/todo/todo.dart';
import 'package:flutter/material.dart';

class PageItem {
  final String title;
  final IconData icon;
  final Widget page;

  const PageItem({required this.title, required this.icon, required this.page});
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key});

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _currentIndex = 0;

  final List<PageItem> _items = const [
    PageItem(title: "Timetable", icon: Icons.schedule_rounded, page: TimetablePage()),
    PageItem(title: "Events", icon: Icons.event, page: MyEvents()),
    PageItem(title: "Todos", icon: Icons.task_alt_rounded, page: MyTodos()),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDarkMode = theme.brightness == Brightness.dark;

    return Scaffold(
      extendBody: true,
      backgroundColor: isDarkMode ? const Color(0xFF0A0A0A) : const Color(0xFFF8F9FA),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        child: _items[_currentIndex].page,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: isDarkMode ? Colors.white.withOpacity(0.05) : Colors.white.withOpacity(0.9),
          border: Border(
            top: BorderSide(
              color: isDarkMode ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.1),
              width: 1,
            ),
          ),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 60,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(_items.length, (index) {
                final item = _items[index];
                final isSelected = index == _currentIndex;

                return GestureDetector(
                  onTap: () => setState(() => _currentIndex = index),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? theme.colorScheme.primary.withOpacity(0.15)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          item.icon,
                          size: 24,
                          color: isSelected
                              ? theme.colorScheme.primary
                              : (isDarkMode ? Colors.white70 : Colors.black54),
                        ),
                        if (isSelected) ...[
                          const SizedBox(width: 8),
                          Text(
                            item.title,
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
