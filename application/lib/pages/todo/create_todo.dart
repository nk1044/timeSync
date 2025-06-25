import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
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
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Todo'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              /// Title
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  hintText: 'Enter title...',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 4, vertical: 12),
                ),
                style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                validator: (v) => v == null || v.isEmpty ? 'Enter a title' : null,
              ),
              const Divider(height: 32),

              /// Description
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  hintText: 'Add more details...',
                  border: InputBorder.none,
                ),
                keyboardType: TextInputType.multiline,
                maxLines: null,
                minLines: 5,
                style: theme.textTheme.bodyLarge,
              ),
              const Divider(height: 40),

              /// Status Dropdown
              DropdownButtonFormField<TodoStatus>(
                value: _status,
                onChanged: (val) => setState(() => _status = val),
                decoration: const InputDecoration(labelText: 'Status'),
                items: TodoStatus.values.map((status) {
                  return DropdownMenuItem(
                    value: status,
                    child: Text(status.name),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),

              /// Tag Dropdown
              DropdownButtonFormField<TodoTag>(
                value: _tag,
                onChanged: (val) => setState(() => _tag = val),
                decoration: const InputDecoration(labelText: 'Tag'),
                items: TodoTag.values.map((tag) {
                  return DropdownMenuItem(
                    value: tag,
                    child: Text(tag.name),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),

              /// Reminder
              Row(
                children: [
                  const Icon(Icons.alarm),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _reminder != null
                          ? "Reminder: ${DateFormat('MMM d, h:mm a').format(_reminder!)}"
                          : "No reminder set",
                      style: theme.textTheme.bodyLarge,
                    ),
                  ),
                  TextButton(
                    onPressed: _pickReminder,
                    child: const Text("Pick"),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              /// Submit Button
              SizedBox(
                width: double.infinity,
                height: 48,
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
                      : const Icon(Icons.check),
                  label: Text(_isLoading ? 'Creating...' : 'Create Todo'),
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    backgroundColor: theme.colorScheme.primary,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickReminder() async {
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
          _reminder = DateTime(date.year, date.month, date.day, time.hour, time.minute);
        });
      }
    }
  }
}
