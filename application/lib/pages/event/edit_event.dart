import 'package:application/pages/event/event_model.dart';
import 'package:application/pages/event/event_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:application/pages/event/event_notes.dart';


class EditEvent extends ConsumerStatefulWidget {
  final String eventId;
  const EditEvent({super.key, required this.eventId});

  @override
  ConsumerState<EditEvent> createState() => _EditEventState();
}

class _EditEventState extends ConsumerState<EditEvent> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _messageController = TextEditingController();

  EventTag? _tag;
  bool _isLoading = false;

  EventTag stringToTag(String value) {
    return EventTag.values.firstWhere(
      (e) => e.name == value,
      orElse: () => EventTag.CLASS,
    );
  }

  Future<void> _submit(String id) async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final repo = ref.read(eventRepositoryProvider);
    final request = EventCreateRequest(
      title: _titleController.text,
      description: _descriptionController.text,
      tag: _tag ?? EventTag.CLASS,
      message: _messageController.text,
    );

    try {
      await repo.updateEvent(id, request);
      if (mounted) {
        ref.invalidate(eventProvider);
        ref.invalidate(singleEventProvider(id));
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Event updated')),
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
        title: const Text('Delete Event?'),
        content: const Text('Are you sure you want to delete this event?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isLoading = true);

    try {
      await ref.read(eventRepositoryProvider).deleteEvent(id);
      if (mounted) {
        ref.invalidate(eventProvider);
        ref.invalidate(singleEventProvider(id));
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('🗑️ Event deleted')),
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
    final eventAsync = ref.watch(singleEventProvider(widget.eventId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Event'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete),
            tooltip: 'Delete Event',
            onPressed: _isLoading ? null : () => _delete(widget.eventId),
          ),
        ],
      ),
      body: eventAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('❌ Failed to load event: $e')),
        data: (event) {
          // Initialize controllers/fields only once
          if (_titleController.text.isEmpty) _titleController.text = event.title;
          if (_descriptionController.text.isEmpty) _descriptionController.text = event.description;
          if (_messageController.text.isEmpty) _messageController.text = event.message;
          _tag ??= stringToTag(event.tag);

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
                    controller: _descriptionController,
                    decoration: const InputDecoration(labelText: 'Description'),
                    maxLines: null,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<EventTag>(
                    value: _tag,
                    onChanged: (v) => setState(() => _tag = v),
                    decoration: const InputDecoration(labelText: 'Tag'),
                    items: EventTag.values
                        .map((tag) => DropdownMenuItem(value: tag, child: Text(tag.name)))
                        .toList(),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _messageController,
                    decoration: const InputDecoration(labelText: 'Message'),
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
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.save),
                      label: Text(_isLoading ? 'Saving...' : 'Save Changes'),
                      onPressed: _isLoading ? null : () => _submit(widget.eventId),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
          onPressed: () {
            Navigator.of(
              context,
            ).push(MaterialPageRoute(builder: (_) => EventNotes(eventId: widget.eventId)));
          },
          tooltip: 'Create Event',
          child: const Icon(Icons.task_alt),
        ),
    );
  }
}
