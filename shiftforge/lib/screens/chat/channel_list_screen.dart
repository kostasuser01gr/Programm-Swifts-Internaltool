import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';

/// Placeholder chat service providers (to be replaced with full implementation)
final channelsProvider = StateProvider<List<_ChannelPreview>>((ref) => [
      _ChannelPreview(
          id: '1',
          name: '#ανακοινώσεις',
          icon: Icons.campaign,
          lastMessage: 'Νέο πρόγραμμα δημοσιεύτηκε',
          unread: 2,
          time: '14:30'),
      _ChannelPreview(
          id: '2',
          name: '#ομάδα-α',
          icon: Icons.group,
          lastMessage: 'Ποιος μπορεί αύριο πρωί;',
          unread: 0,
          time: '13:15'),
      _ChannelPreview(
          id: '3',
          name: '#ομάδα-β',
          icon: Icons.group,
          lastMessage: 'Αλλαγή βάρδιας Σάββατο',
          unread: 5,
          time: '12:40'),
      _ChannelPreview(
          id: '4',
          name: '#γενικό',
          icon: Icons.chat_bubble_outline,
          lastMessage: 'Καλημέρα σε όλους!',
          unread: 0,
          time: 'χθες'),
      _ChannelPreview(
          id: '5',
          name: '#βοήθεια',
          icon: Icons.help_outline,
          lastMessage: 'Πώς αλλάζω κωδικό;',
          unread: 1,
          time: 'χθες'),
    ]);

class _ChannelPreview {
  final String id;
  final String name;
  final IconData icon;
  final String lastMessage;
  final int unread;
  final String time;

  _ChannelPreview({
    required this.id,
    required this.name,
    required this.icon,
    required this.lastMessage,
    required this.unread,
    required this.time,
  });
}

class ChannelListScreen extends ConsumerWidget {
  const ChannelListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final channels = ref.watch(channelsProvider);
    final authState = ref.watch(authProvider);
    final canCreate = authState.role.canCreateChannels;
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Συνομιλίες'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            tooltip: 'Αναζήτηση',
            onPressed: () {},
          ),
          if (canCreate)
            IconButton(
              icon: const Icon(Icons.add),
              tooltip: 'Νέο Κανάλι',
              onPressed: () => _createChannel(context),
            ),
        ],
      ),
      body: channels.isEmpty
          ? const Center(child: Text('Κανένα κανάλι ακόμη'))
          : ListView.separated(
              itemCount: channels.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final ch = channels[i];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: colors.primaryContainer,
                    child: Icon(ch.icon,
                        color: colors.onPrimaryContainer, size: 20),
                  ),
                  title: Row(
                    children: [
                      Expanded(
                        child: Text(ch.name,
                            style:
                                const TextStyle(fontWeight: FontWeight.w600)),
                      ),
                      Text(ch.time,
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: colors.onSurfaceVariant)),
                    ],
                  ),
                  subtitle: Text(
                    ch.lastMessage,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight:
                          ch.unread > 0 ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                  trailing: ch.unread > 0
                      ? Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: colors.primary,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text('${ch.unread}',
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 12)),
                        )
                      : null,
                  onTap: () => _openThread(context, ch),
                );
              },
            ),
    );
  }

  void _openThread(BuildContext context, _ChannelPreview ch) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _ChatThread(channelName: ch.name),
      ),
    );
  }

  void _createChannel(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Δημιουργία καναλιού — υπό ανάπτυξη')),
    );
  }
}

// ── Inline Chat Thread (placeholder) ────────────────────
class _ChatThread extends StatefulWidget {
  final String channelName;
  const _ChatThread({required this.channelName});

  @override
  State<_ChatThread> createState() => _ChatThreadState();
}

class _ChatThreadState extends State<_ChatThread> {
  final _controller = TextEditingController();
  final List<_MockMessage> _messages = [
    _MockMessage('Αρχηγός', 'Νέο πρόγραμμα αναρτήθηκε!', '14:30'),
    _MockMessage('ΤΖΑΝΙΔΑΚΗ', 'Ευχαριστώ!', '14:32'),
    _MockMessage('ΠΑΠΑΔΟΠΟΥΛΟΣ', 'Θα δω τις βάρδιες μου', '14:35'),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.channelName)),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              reverse: true,
              padding: const EdgeInsets.all(12),
              itemCount: _messages.length,
              itemBuilder: (_, i) {
                final msg = _messages[_messages.length - 1 - i];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      CircleAvatar(
                        radius: 16,
                        child: Text(msg.author[0],
                            style: const TextStyle(fontSize: 12)),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(msg.author,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13)),
                                const SizedBox(width: 8),
                                Text(msg.time,
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: Theme.of(context)
                                            .colorScheme
                                            .onSurfaceVariant)),
                              ],
                            ),
                            Text(msg.text),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          // Input bar
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              border: Border(
                  top: BorderSide(color: Theme.of(context).dividerColor)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: const InputDecoration(
                      hintText: 'Γράψε μήνυμα...',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    onSubmitted: (_) => _send(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: _send,
                  icon: const Icon(Icons.send, size: 20),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _send() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _messages.add(_MockMessage('Εσύ', text,
          '${TimeOfDay.now().hour}:${TimeOfDay.now().minute.toString().padLeft(2, '0')}'));
      _controller.clear();
    });
  }
}

class _MockMessage {
  final String author;
  final String text;
  final String time;
  _MockMessage(this.author, this.text, this.time);
}
