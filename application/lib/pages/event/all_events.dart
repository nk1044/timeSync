import 'package:application/pages/event/event_card.dart';
import 'package:application/pages/event/event_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AllEvents extends ConsumerWidget {
  const AllEvents({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventAsync = ref.watch(eventProvider);

    return Scaffold(
      body: eventAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (events) {
          if (events.isEmpty) {
            return const Center(child: Text("No todos available."));
          }
          return ListView.builder(
            itemCount: events.length,
            itemBuilder: (context, index) {
              final event = events[index];
              return EventCard(event: event);
            },
          );
        },
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(
          bottom: 100.0,
        ), // 👈 Lift FAB above nav bar
      )
    );
  }
}
