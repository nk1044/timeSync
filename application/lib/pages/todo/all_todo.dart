import 'package:application/pages/todo/todo_provider.dart';
import 'package:application/pages/todo/todo_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AllTodos extends ConsumerWidget {
  const AllTodos({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final todosAsync = ref.watch(todosProvider);

    return Scaffold(
      body: todosAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
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
        padding: const EdgeInsets.only(
          bottom: 100.0,
        ), // 👈 Lift FAB above nav bar
      )
    );
  }
}
