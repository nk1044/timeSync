import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:application/pages/todo/all_todo.dart';
import 'package:application/pages/todo/create_todo.dart';
import 'package:application/pages/todo/todo_provider.dart';

class MyTodos extends ConsumerWidget {
  const MyTodos({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      extendBody: true,
      appBar: AppBar(
        title: const Text('All Todos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Todos',
            onPressed: () {
              ref.invalidate(todosProvider);
            },
          ),
        ],
      ),
      body: const AllTodos(),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(
          bottom: 100.0,
        ), // 👈 Lift FAB above nav bar
        child: FloatingActionButton(
          onPressed: () {
            Navigator.of(
              context,
            ).push(MaterialPageRoute(builder: (_) => const CreateTodo()));
          },
          tooltip: 'Create Todo',
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}
