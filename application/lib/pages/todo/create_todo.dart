import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:application/pages/todo/todo_model.dart';
import 'package:application/pages/todo/todo_provider.dart';

class CreateTodo extends ConsumerStatefulWidget {
  const CreateTodo({super.key});

  @override
  ConsumerState<CreateTodo> createState() => _CreateTodoState();
}

class _CreateTodoState extends ConsumerState<CreateTodo> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();

  TodoStatus? _status = TodoStatus.PERSONAL;
  TodoTag? _tag = TodoTag.NOT_IMPORTANT;
  DateTime? _reminder;
  bool _isLoading = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final repo = ref.read(todoRepositoryProvider);
    final request = TodoCreateRequest(
      title: _titleController.text,
      description: _descriptionController.text,
      status: statusToString(_status!),
      tag: tagToString(_tag!),
      reminder: _reminder,
    );

    try {
      await repo.createTodo(request);
      if (mounted) {
        ref.invalidate(todosProvider);
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Todo created')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Failed to create todo: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Todo')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(labelText: 'Title'),
                validator: (v) => v == null || v.isEmpty ? 'Enter a title' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(labelText: 'Description'),
                keyboardType: TextInputType.multiline,
                maxLines: null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<TodoStatus>(
                value: _status,
                onChanged: (value) => setState(() => _status = value),
                decoration: const InputDecoration(labelText: 'Status'),
                items: TodoStatus.values.map((status) {
                  return DropdownMenuItem(
                    value: status,
                    child: Text(status.name),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<TodoTag>(
                value: _tag,
                onChanged: (value) => setState(() => _tag = value),
                decoration: const InputDecoration(labelText: 'Tag'),
                items: TodoTag.values.map((tag) {
                  return DropdownMenuItem(
                    value: tag,
                    child: Text(tag.name),
                  );
                }).toList(),
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
                    initialDate: DateTime.now(),
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
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Icon(Icons.save),
                  label: Text(_isLoading ? 'Creating...' : 'Create Todo'),
                  onPressed: _isLoading ? null : _submit,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
