import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:application/pages/event/event_model.dart';
import 'package:application/pages/event/event_provider.dart';

class CreateEvent extends ConsumerStatefulWidget {
  const CreateEvent({super.key});

  @override
  ConsumerState<CreateEvent> createState() => _CreateEventState();
}

class _CreateEventState extends ConsumerState<CreateEvent> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _messageController = TextEditingController();

  EventTag? _tag = EventTag.CLASS;
  bool _isLoading = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final repo = ref.read(eventRepositoryProvider);
    final request = EventCreateRequest(
      title: _titleController.text,
      description: _descriptionController.text,
      tag: _tag ?? EventTag.CLASS, // Default to CLASS if null
      message: _messageController.text,
    );

    try {
      await repo.createEvent(request);
      if (mounted) {
        ref.invalidate(eventProvider);
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Event created')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Failed to create event: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Event')),
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
              DropdownButtonFormField<EventTag>(
                value: _tag,
                onChanged: (value) => setState(() => _tag = value),
                decoration: const InputDecoration(labelText: 'Tag'),
                items: EventTag.values.map((tag) {
                  return DropdownMenuItem(
                    value: tag,
                    child: Text(tag.name),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _messageController,
                decoration: const InputDecoration(labelText: 'Message'),
                keyboardType: TextInputType.text,
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
                  label: Text(_isLoading ? 'Creating...' : 'Create Event'),
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
