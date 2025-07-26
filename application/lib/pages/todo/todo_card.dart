import 'package:application/pages/todo/todo_model.dart';
import 'package:application/pages/todo/edit_todo.dart';
import 'package:application/pages/todo/todo_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

class TodoCard extends ConsumerStatefulWidget {
  final Todo todo;

  const TodoCard({Key? key, required this.todo}) : super(key: key);

  @override
  ConsumerState<TodoCard> createState() => _TodoCardState();
}

class _TodoCardState extends ConsumerState<TodoCard> {
  bool _isLoading = false;

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: color),
    );
  }

  Future<void> _delete(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Todo?'),
        content: const Text('Are you sure you want to delete this todo?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isLoading = true);

    try {
      await ref.read(todoRepositoryProvider).deleteTodo(id);
      if (mounted) {
        ref.invalidate(todosProvider);
        ref.invalidate(singleTodoProvider(id));
        _showSnackBar('🗑️ Todo deleted', Colors.red);
      }
    } catch (e) {
      if (mounted) _showSnackBar('❌ Delete failed: $e', Colors.red);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final todo = widget.todo;
    final updatedAt = DateFormat.yMMMd().add_jm().format(todo.updatedAt);

    return Dismissible(
      key: Key(todo.id),
      direction: DismissDirection.endToStart,
      background: Container(
        color: Colors.red,
        alignment: Alignment.centerRight,
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      confirmDismiss: (_) async {
        if (_isLoading) return false;
        final result = await showDialog<bool>(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('Delete Todo?'),
            content: const Text('Are you sure you want to delete this todo?'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
              TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
            ],
          ),
        );
        return result ?? false;
      },
      onDismissed: (_) => _delete(todo.id),
      child: Card(
        elevation: 2,
        margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
          title: Text(
            todo.title,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
          ),
          subtitle: Text(
            'Updated: $updatedAt',
            style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
          ),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => EditTodo(todoId: todo.id)),
            );
          },
        ),
      ),
    );
  }
}
