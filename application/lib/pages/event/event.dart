import 'package:application/pages/event/all_events.dart';
import 'package:application/pages/event/create_event.dart';
import 'package:application/pages/event/event_provider.dart';
import 'package:application/pages/user/settings.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class MyEvents extends ConsumerWidget {
  const MyEvents({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      extendBody: true,
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
                  'All Todos',
                  style: Theme.of(context).appBarTheme.titleTextStyle,
                ),
              ),
            ),

            // Right: Refresh Button
            IconButton(
              icon: const Icon(Icons.refresh),
              tooltip: 'Refresh Events',
              onPressed: () {
                ref.invalidate(eventProvider);
              },
            ),
          ],
        ),
      ),
      body: const AllEvents(),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(
          bottom: 100.0,
        ), // 👈 Lift FAB above nav bar
        child: FloatingActionButton(
          onPressed: () {
            Navigator.of(
              context,
            ).push(MaterialPageRoute(builder: (_) => const CreateEvent()));
          },
          tooltip: 'Create Event',
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}
