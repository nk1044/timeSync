import 'package:application/pages/event/event_model.dart';
import 'package:application/pages/event/event_provider.dart';
import 'package:application/pages/event/event_notes.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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

  bool _isLoading = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit(String id) async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    final repo = ref.read(eventRepositoryProvider);
    final request = EventCreateRequest(
      title: _titleController.text,
      description: _descriptionController.text,
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
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
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
    final theme = Theme.of(context);
    final eventAsync = ref.watch(singleEventProvider(widget.eventId));

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Edit Event'),
        elevation: 0,
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.delete),
            tooltip: 'Delete Event',
            onPressed: _isLoading ? null : () => _delete(widget.eventId),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => EventNotes(eventId: widget.eventId)),
          );
        },
        tooltip: 'Open Notes',
        child: const Icon(Icons.task_alt),
      ),
      body: eventAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('❌ Failed to load event: $e')),
        data: (event) {
          // Set initial values (only once)
          if (_titleController.text.isEmpty) _titleController.text = event.title;
          if (_descriptionController.text.isEmpty) _descriptionController.text = event.description;
          if (_messageController.text.isEmpty) _messageController.text = event.message;

          return SafeArea(
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  // Title
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(5, 10, 5, 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Event Title',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: theme.colorScheme.onSurface.withOpacity(0.8),
                          ),
                        ),
                        const SizedBox(height: 5),
                        Container(
                          decoration: BoxDecoration(
                            color: theme.colorScheme.surface,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: theme.colorScheme.outline.withOpacity(0.2),
                            ),
                          ),
                          child: TextFormField(
                            controller: _titleController,
                            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500),
                            decoration: InputDecoration(
                              hintText: 'Enter event title...',
                              hintStyle: TextStyle(
                                color: theme.colorScheme.onSurface.withOpacity(0.5),
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.all(16),
                            ),
                            validator: (v) => v == null || v.isEmpty ? 'Enter a title' : null,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Description
                  Expanded(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 5),
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: theme.colorScheme.outline.withOpacity(0.2),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: theme.colorScheme.shadow.withOpacity(0.05),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(2, 20, 2, 12),
                            child: Row(
                              children: [
                                Icon(Icons.description_outlined, size: 20, color: theme.colorScheme.primary),
                                const SizedBox(width: 8),
                                Text(
                                  'Description',
                                  style: theme.textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: theme.colorScheme.onSurface.withOpacity(0.8),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: Container(
                              decoration: BoxDecoration(color: theme.colorScheme.surface),
                              child: TextFormField(
                                controller: _descriptionController,
                                maxLines: null,
                                expands: true,
                                textAlignVertical: TextAlignVertical.top,
                                style: theme.textTheme.bodyMedium,
                                decoration: InputDecoration(
                                  hintText: 'Describe your event in detail...',
                                  hintStyle: TextStyle(
                                    color: theme.colorScheme.onSurface.withOpacity(0.4),
                                    height: 1.5,
                                  ),
                                  border: InputBorder.none,
                                  contentPadding: const EdgeInsets.all(10),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Message + Submit Button
                  Container(
                    padding: const EdgeInsets.all(5),
                    child: Column(
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            color: theme.colorScheme.surface,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: theme.colorScheme.outline.withOpacity(0.2),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: theme.colorScheme.shadow.withOpacity(0.05),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.fromLTRB(10, 16, 10, 8),
                                child: Row(
                                  children: [
                                    Icon(Icons.message_outlined, size: 18, color: theme.colorScheme.primary),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Special Message',
                                      style: theme.textTheme.titleSmall?.copyWith(
                                        fontWeight: FontWeight.w600,
                                        color: theme.colorScheme.onSurface.withOpacity(0.8),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              TextFormField(
                                controller: _messageController,
                                style: theme.textTheme.bodyMedium,
                                decoration: InputDecoration(
                                  hintText: 'Add a special message for attendees...',
                                  hintStyle: TextStyle(
                                    color: theme.colorScheme.onSurface.withOpacity(0.5),
                                  ),
                                  border: InputBorder.none,
                                  contentPadding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                        Container(
                          width: double.infinity,
                          height: 56,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            gradient: LinearGradient(
                              colors: _isLoading
                                  ? [
                                      theme.colorScheme.primary.withOpacity(0.6),
                                      theme.colorScheme.primary.withOpacity(0.4),
                                    ]
                                  : [
                                      theme.colorScheme.primary,
                                      theme.colorScheme.primary.withOpacity(0.8),
                                    ],
                            ),
                            boxShadow: _isLoading
                                ? []
                                : [
                                    BoxShadow(
                                      color: theme.colorScheme.primary.withOpacity(0.3),
                                      blurRadius: 12,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                          ),
                          child: ElevatedButton.icon(
                            onPressed: _isLoading ? null : () => _submit(widget.eventId),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              shadowColor: Colors.transparent,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            icon: _isLoading
                                ? SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      color: theme.colorScheme.onPrimary,
                                      strokeWidth: 2.5,
                                    ),
                                  )
                                : Icon(Icons.save, color: theme.colorScheme.onPrimary),
                            label: Text(
                              _isLoading ? 'Saving...' : 'Save Changes',
                              style: theme.textTheme.titleMedium?.copyWith(
                                color: theme.colorScheme.onPrimary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
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
