import 'package:application/pages/todo/todo_model.dart';
import 'package:application/pages/todo/edit_todo.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class TodoCard extends StatelessWidget {
  final Todo todo;

  const TodoCard({Key? key, required this.todo}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isImportant = todo.tag == 'IMPORTANT';
    final updatedAt = DateFormat.yMMMd().add_jm().format(todo.updatedAt);

    return Card(
      elevation: 2,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        title: Text(
          todo.title,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
        subtitle: Text(
          'Updated: $updatedAt',
          style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
        ),
        trailing: isImportant
            ? const Icon(
                Icons.flag_rounded,
                color: Colors.orangeAccent,
              )
            : null,
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => EditTodo(todoId: todo.id),
            ),
          );
        },
      ),
    );
  }
}
