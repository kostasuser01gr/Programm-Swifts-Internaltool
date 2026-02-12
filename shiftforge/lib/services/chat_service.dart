import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pocketbase/pocketbase.dart';
import '../models/models.dart';
import '../services/pocketbase_client.dart';

/// Chat service provider
final chatServiceProvider = Provider<ChatService>((ref) {
  final pb = ref.watch(pbProvider);
  return ChatService(pb);
});

/// Active channel state
final activeChannelProvider = StateProvider<String?>((ref) => null);

/// Stream of messages for the active channel
final channelMessagesProvider =
    FutureProvider.family<List<ChatMessage>, String>((ref, channelId) async {
  final service = ref.watch(chatServiceProvider);
  return service.fetchMessages(channelId);
});

/// All channels for current user
final allChannelsProvider = FutureProvider<List<Channel>>((ref) async {
  final service = ref.watch(chatServiceProvider);
  return service.fetchChannels();
});

class ChatService {
  final PocketBase _pb;

  ChatService(this._pb);

  /// Fetch all channels (filtered by user's access via API rules)
  Future<List<Channel>> fetchChannels() async {
    final records = await _pb.collection('channels').getFullList(
          sort: '-created',
        );
    return records.map((r) => Channel.fromJson(r.toJson())).toList();
  }

  /// Fetch messages for a specific channel (newest first, paginated)
  Future<List<ChatMessage>> fetchMessages(
    String channelId, {
    int page = 1,
    int perPage = 50,
  }) async {
    final result = await _pb.collection('chat_messages').getList(
          page: page,
          perPage: perPage,
          filter: 'channelId = "$channelId"',
          sort: '-created',
          expand: 'senderId',
        );
    return result.items
        .map((r) => ChatMessage.fromJson(r.toJson()))
        .toList();
  }

  /// Send a message to a channel
  Future<ChatMessage> sendMessage({
    required String channelId,
    required String senderId,
    required String body,
    String? replyToId,
  }) async {
    final data = {
      'channelId': channelId,
      'senderId': senderId,
      'body': body,
      if (replyToId != null) 'replyToId': replyToId,
    };
    final record = await _pb.collection('chat_messages').create(body: data);
    return ChatMessage.fromJson(record.toJson());
  }

  /// Create a new channel
  Future<Channel> createChannel({
    required String name,
    required String type,
    String? description,
    List<String>? memberIds,
  }) async {
    final data = {
      'name': name,
      'type': type,
      'description': description ?? '',
      'memberIds': memberIds ?? [],
    };
    final record = await _pb.collection('channels').create(body: data);
    return Channel.fromJson(record.toJson());
  }

  /// Subscribe to real-time messages in a channel
  void subscribeToChannel(
    String channelId,
    void Function(ChatMessage message) onMessage,
  ) {
    _pb.collection('chat_messages').subscribe(
      '*',
      (e) {
        if (e.action == 'create' && e.record != null) {
          final json = e.record!.toJson();
          if (json['channelId'] == channelId) {
            onMessage(ChatMessage.fromJson(json));
          }
        }
      },
      filter: 'channelId = "$channelId"',
    );
  }

  /// Unsubscribe from channel messages
  void unsubscribeFromChannel() {
    _pb.collection('chat_messages').unsubscribe('*');
  }
}
