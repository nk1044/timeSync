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
      appBar: AppBar(
        title: const Text('All Todos'),
      ),
      body: todosAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(),
        ),
        error: (err, stack) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Something went wrong 😞',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                err.toString(),
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(todosProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (todos) {
          if (todos.isEmpty) {
            return const Center(
              child: Text(
                '📝 No todos yet. Time to add some!',
                style: TextStyle(fontSize: 16),
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(vertical: 16),
            itemCount: todos.length,
            itemBuilder: (context, index) {
              final todo = todos[index];
              return TodoCard(todo: todo);
            },
            separatorBuilder: (context, index) => const SizedBox(height: 8),
          );
        },
      ),
      floatingActionButton: const SizedBox.shrink(), // You can place your FAB here
    );
  }
}
