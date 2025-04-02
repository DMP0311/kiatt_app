import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Send } from 'lucide-react-native';
import LoadingAnimation from '../components/LoadingAnimation';

type Message = {
  id: string;
  sender: 'user' | 'system';
  text: string;
  createdAt: string;
};

type QuickReply = {
  id: string;
  text: string;
};

export default function ChatStaticScreen() {
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'system',
      text: 'Welcome to our service! How can we help you today?',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [newMessage, setNewMessage] = useState<string>('');
  const quickReplies: QuickReply[] = [
    { id: '1', text: 'Room cleaning service' },
    { id: '2', text: 'Restaurant reservation' },
    { id: '3', text: 'Book a spa appointment' },
  ];
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  // Hàm gửi tin nhắn. Khi được gọi, tin nhắn của người dùng sẽ được thêm vào và sau đó hệ thống phản hồi.
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    // Giả lập phản hồi từ hệ thống sau 1.5 giây
    setTimeout(() => {
      const systemMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        text: `System reply: "${text.trim()}"`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, systemMsg]);
    }, 1500);
  };

  // Khi nhấn Quick Reply, gọi hàm gửi tin nhắn với nội dung trả lời ngay lập tức.
  const handleQuickReply = (replyText: string) => {
    handleSendMessage(replyText);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userBubble : styles.systemBubble,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );
  if (loading) {
    return <LoadingAnimation />;
  }
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customer Service</Text>
      </View>

      {/* Message List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
      />

      {/* Quick Reply Section */}
      <View style={styles.quickRepliesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickReplies.map((reply) => (
            <TouchableOpacity
              key={reply.id}
              style={styles.quickReplyButton}
              onPress={() => handleQuickReply(reply.text)}
            >
              <Text style={styles.quickReplyText}>{reply.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Section */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor="#999"
          value={newMessage}
          onChangeText={setNewMessage}
          onSubmitEditing={() => {
            handleSendMessage(newMessage);
            setNewMessage('');
          }}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => {
            handleSendMessage(newMessage);
            setNewMessage('');
          }}
        >
          <Send size={20} color="#fff" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 16 },
  messageList: { padding: 16, paddingBottom: 100 },
  messageBubble: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    maxWidth: '75%',
  },
  userBubble: {
    backgroundColor: '#0ea5e9',
    alignSelf: 'flex-end',
  },
  systemBubble: {
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start',
  },
  messageText: { color: '#000' },
  quickRepliesContainer: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  quickReplyButton: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 6,
  },
  quickReplyText: { color: '#0284c7', fontSize: 14 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    marginRight: 8,
    color: '#000',
  },
  sendButton: {
    backgroundColor: '#0ea5e9',
    padding: 10,
    borderRadius: 20,
  },
});
