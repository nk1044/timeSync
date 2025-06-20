import 'package:application/pages/event/event_provider.dart';
import 'package:application/pages/todo/todo_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class EventNotes extends ConsumerWidget {
  final String eventId;
  const EventNotes({super.key, required this.eventId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final todosAsync = ref.watch(eventNotesProvider(eventId));

    return Scaffold(
      appBar: AppBar(title: const Text('Event Notes')),
      body: todosAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('❌ Error: $err')),
        data: (todos) {
          if (todos.isEmpty) {
            return const Center(child: Text("No todos available."));
          }
          return ListView.builder(
            itemCount: todos.length,
            itemBuilder: (context, index) {
              final todo = todos[index];
              return TodoCard(todo: todo);
            },
          );
        },
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 100),
        child: FloatingActionButton(
          onPressed: () {
            
          },
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}
