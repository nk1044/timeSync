import 'package:application/pages/todo/todo_model.dart';
import 'package:application/pages/todo/todo_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class EditTodo extends ConsumerStatefulWidget {
  final String todoId;
  const EditTodo({super.key, required this.todoId});

  @override
  ConsumerState<EditTodo> createState() => _EditTodoState();
}

class _EditTodoState extends ConsumerState<EditTodo> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();

  TodoStatus? _status;
  TodoTag? _tag;
  DateTime? _reminder;
  bool _isLoading = false;

  // Convert from string to enum
  TodoStatus stringToStatus(String value) {
    return TodoStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => TodoStatus.PERSONAL,
    );
  }

  TodoTag stringToTag(String value) {
    return TodoTag.values.firstWhere(
      (e) => e.name == value,
      orElse: () => TodoTag.NOT_IMPORTANT,
    );
  }

  Future<void> _submit(String id) async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final repo = ref.read(todoRepositoryProvider);
    final request = TodoCreateRequest(
      title: _titleController.text,
      description: _descController.text,
      status: _status!.name,
      tag: _tag!.name,
      reminder: _reminder,
    );

    try {
      await repo.updateTodo(id, request);
      if (mounted) {
        ref.invalidate(todosProvider);
        ref.invalidate(singleTodoProvider(id)); // Invalidate to avoid stale data
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Todo updated')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Update failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
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
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('🗑️ Todo deleted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Delete failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final todoAsync = ref.watch(singleTodoProvider(widget.todoId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Todo'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete),
            tooltip: 'Delete Todo',
            onPressed: _isLoading ? null : () => _delete(widget.todoId),
          ),
        ],
      ),
      body: todoAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('❌ Failed to load todo: $e')),
        data: (todo) {
          // Set values only once when data is first received
          _titleController.text = _titleController.text.isEmpty ? todo.title : _titleController.text;
          _descController.text = _descController.text.isEmpty ? todo.description : _descController.text;
          _status ??= stringToStatus(todo.status);
          _tag ??= stringToTag(todo.tag);
          _reminder ??= todo.reminder;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  TextFormField(
                    controller: _titleController,
                    decoration: const InputDecoration(labelText: 'Title'),
                    validator: (v) => v == null || v.isEmpty ? 'Title is required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _descController,
                    decoration: const InputDecoration(labelText: 'Description'),
                    keyboardType: TextInputType.multiline,
                    maxLines: null,
                    minLines: 4,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<TodoStatus>(
                    value: _status,
                    onChanged: (v) => setState(() => _status = v),
                    decoration: const InputDecoration(labelText: 'Status'),
                    items: TodoStatus.values
                        .map((s) => DropdownMenuItem(value: s, child: Text(s.name)))
                        .toList(),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<TodoTag>(
                    value: _tag,
                    onChanged: (v) => setState(() => _tag = v),
                    decoration: const InputDecoration(labelText: 'Tag'),
                    items: TodoTag.values
                        .map((t) => DropdownMenuItem(value: t, child: Text(t.name)))
                        .toList(),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.calendar_today),
                    label: Text(_reminder != null
                        ? 'Reminder: ${_reminder!.toLocal()}'.split('.')[0]
                        : 'Pick Reminder'),
                    onPressed: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: _reminder ?? DateTime.now(),
                        firstDate: DateTime.now().subtract(const Duration(days: 1)),
                        lastDate: DateTime(2100),
                      );
                      if (date != null) {
                        final time = await showTimePicker(
                          context: context,
                          initialTime: TimeOfDay.now(),
                        );
                        if (time != null) {
                          setState(() {
                            _reminder = DateTime(
                              date.year, date.month, date.day, time.hour, time.minute,
                            );
                          });
                        }
                      }
                    },
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(Icons.save),
                      label: Text(_isLoading ? 'Saving...' : 'Save Changes'),
                      onPressed: _isLoading ? null : () => _submit(widget.todoId),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
