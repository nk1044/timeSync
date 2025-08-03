import 'package:application/pages/event/edit_event.dart';
import 'package:application/pages/event/event_model.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class EventCard extends StatelessWidget {
  final Event event;

  const EventCard({super.key, required this.event});

  @override
  Widget build(BuildContext context) {
    final updatedAt = DateFormat.yMMMd().add_jm().format(event.updatedAt);
    final message = event.message.isNotEmpty ? event.message : 'No message provided';

    return Card(
      elevation: 2,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        title: Text(
          event.title,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Message: $message',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
            ),
            Text(
              'Updated: $updatedAt',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
            ),
          ],
        ),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => EditEvent(eventId: event.id),
            ),
          );
        },
      ),
    );
  }
}
