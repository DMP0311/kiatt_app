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
  Image,
  Dimensions,
} from 'react-native';
import {
  Send,
  TreePalm,
  Umbrella,
  Utensils,
  MapPin,
  Coffee,
  Clock,
  HandPlatter,
  Calendar,
} from 'lucide-react-native';
import LoadingAnimation from '../components/LoadingAnimation';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type Message = {
  id: string;
  sender: 'user' | 'system';
  text: string;
  createdAt: string;
};

type QuickReply = {
  id: string;
  text: string;
  icon: React.ReactNode;
};

// Predefined responses for common questions
const knowledgeBase = {
  'room cleaning':
    'We offer room cleaning services daily between 9 AM and 4 PM. Would you like to schedule a specific time for your room to be cleaned?',
  'clean my room':
    "I'll be happy to arrange for your room to be cleaned. Our housekeeping staff is available between 9 AM and 4 PM. When would be a convenient time for you?",
  restaurant:
    'Our resort restaurant serves breakfast from 6-10 AM, lunch from 12-2 PM, and dinner from 6-10 PM. Would you like to make a reservation?',
  food: 'Our restaurant offers a variety of international and local cuisine. Breakfast is from 6-10 AM, lunch from 12-2 PM, and dinner from 6-10 PM.',
  reservation:
    "I'd be happy to help you with a reservation. Please let me know how many people and what time you'd prefer.",
  HandPlatter:
    'Our spa is open daily from 9 AM to 9 PM and offers a range of massages, facials, and body treatments. Would you like to book an appointment?',
  massage:
    'We offer various massage treatments at our spa, including Swedish, deep tissue, hot stone, and aromatherapy massages. The spa is open from 9 AM to 9 PM.',
  swimming:
    "Our swimming pool is open from 6 AM to 10 PM daily. Towels are provided poolside, and there's a pool bar serving drinks and light snacks.",
  pool: "The resort swimming pool is open from 6 AM to 10 PM. We also have a children's pool area with lifeguards on duty throughout the day.",
  'check in':
    "Check-in time is at 2 PM. If you arrive earlier, we're happy to store your luggage while you enjoy our facilities.",
  'check out':
    'Check-out time is at 12 PM. Late check-out may be available depending on occupancy - please inquire at the front desk.',
  wifi: "Complimentary WiFi is available throughout the resort. The network name is 'Resort_Guest' and the password is provided during check-in.",
  internet:
    'Free high-speed WiFi is available throughout the resort. You should have received the access code during check-in.',
  gym: 'Our fitness center is open 24 hours for hotel guests. It includes cardio equipment, free weights, and strength training machines.',
  fitness:
    'The resort fitness center is open 24/7 and is equipped with modern cardio and strength training equipment.',
  beach:
    'The private beach is just a 2-minute walk from the main building. Beach chairs, umbrellas, and towels are available for our guests.',
  towels:
    'Fresh towels are available at the pool area, spa, fitness center, and beach. You can also request additional towels through housekeeping.',
  breakfast:
    'Breakfast is served at our main restaurant from 6 AM to 10 AM. We offer both buffet and à la carte options.',
  lunch:
    'Lunch is available from 12 PM to 2 PM at our main restaurant and until 4 PM at the pool bar.',
  dinner:
    'Dinner is served from 6 PM to 10 PM. We recommend reservations, especially during peak season.',
  bar: 'We have several bars on the property: the main lobby bar (open 10 AM-midnight), the pool bar (open 10 AM-6 PM), and the lounge bar (open 6 PM-2 AM).',
  drinks:
    'Beverages are available at our lobby bar, pool bar, and evening lounge. We offer a wide selection of cocktails, wines, and non-alcoholic options.',
  'room service':
    'Room service is available 24 hours. You can find the menu in your room or request one from our staff.',
  laundry:
    'Laundry and dry-cleaning services are available. Items submitted before 9 AM will be returned the same day (except on Sundays and holidays).',
  shuttle:
    'We offer complimentary shuttle service to and from the city center. The shuttle runs every two hours from 8 AM to 10 PM.',
  transportation:
    'We can arrange airport transfers, taxi services, or rental cars. Please contact the concierge for assistance.',
  activities:
    'We offer various activities including water sports, cooking classes, yoga sessions, and local excursions. The activities desk is open from 8 AM to 6 PM.',
  excursions:
    'Our concierge can help arrange local excursions, guided tours, and adventure activities. Please book at least 24 hours in advance.',
  children:
    "We have a kids' club for children aged 4-12, open from 9 AM to 5 PM. Babysitting services can be arranged with advance notice.",
  kids: "Our kids' club offers supervised activities for children aged 4-12. We also have a children's pool and a playground on the property.",
  price:
    'For the most current rates and any special offers, please contact our reception desk or check at the front desk.',
  cost: "I don't have specific pricing information. For the most accurate and up-to-date rates, please inquire at the reception desk.",
  'special requests':
    "We're happy to accommodate special requests whenever possible. Please let us know how we can make your stay more comfortable.",
  'thank you':
    "You're welcome! If you need anything else, please don't hesitate to ask.",
  thanks: "You're welcome! I'm here to help make your stay enjoyable.",
};

export default function ChatStaticScreen() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'system',
      text: "Welcome to Paradise Resort! I'm your virtual concierge. How may I enhance your stay today?",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [newMessage, setNewMessage] = useState<string>('');
  const quickReplies: QuickReply[] = [
    {
      id: '1',
      text: 'Room Service',
      icon: <Coffee size={16} color="#0891b2" />,
    },
    {
      id: '2',
      text: 'Restaurant',
      icon: <Utensils size={16} color="#0891b2" />,
    },
    {
      id: '3',
      text: 'Spa Services',
      icon: <HandPlatter size={16} color="#0891b2" />,
    },
    {
      id: '4',
      text: 'Beach Info',
      icon: <Umbrella size={16} color="#0891b2" />,
    },
    {
      id: '5',
      text: 'Activities',
      icon: <TreePalm size={16} color="#0891b2" />,
    },
    {
      id: '6',
      text: 'Local Tours',
      icon: <MapPin size={16} color="#0891b2" />,
    },
    {
      id: '7',
      text: 'Check-out Time',
      icon: <Clock size={16} color="#0891b2" />,
    },
    {
      id: '8',
      text: 'Make Reservation',
      icon: <Calendar size={16} color="#0891b2" />,
    },
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

  // Find the best matching response from knowledge base
  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    // Check for exact matches in our knowledge base
    for (const [key, response] of Object.entries(knowledgeBase)) {
      if (input === key) {
        return response;
      }
    }

    // Check for partial matches
    for (const [key, response] of Object.entries(knowledgeBase)) {
      if (input.includes(key)) {
        return response;
      }
    }

    // Default responses for no match
    const defaultResponses = [
      "I'd be happy to help with that. Could you provide more details about what you're looking for?",
      "Our team is ready to make your stay unforgettable. For this specific request, please contact our reception desk or tap 'Room Service' in the quick menu.",
      "Paradise Resort offers many amenities to enhance your stay. Could you clarify which service you're interested in?",
      'From beachfront relaxation to exciting excursions, we have everything you need. Are you interested in dining, activities, or wellness services?',
      "I'm your personal vacation assistant. Could you please be more specific with your request so I can help you enjoy your stay to the fullest?",
    ];

    // Return a random default response
    return defaultResponses[
      Math.floor(Math.random() * defaultResponses.length)
    ];
  };

  // Function to handle sending a message
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setNewMessage('');

    // Simulate typing delay for realism
    setTimeout(() => {
      const botResponse = getBotResponse(text.trim());

      const systemMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        text: botResponse,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, systemMsg]);
    }, 1000);
  };

  // When Quick Reply is pressed, send that message immediately
  const handleQuickReply = (replyText: string) => {
    handleSendMessage(replyText);
  };

  // Phần renderMessage
  const renderMessage = ({ item }: { item: Message }) => {
    if (item.sender === 'system') {
      return (
        <View style={styles.systemMessageRow}>
          <Image
            source={require('@/assets/concierge-avatar.png')}
            style={styles.systemAvatar}
            defaultSource={require('@/assets/concierge-avatar.png')}
          />
          <View style={[styles.messageBubble, styles.systemBubble]}>
            <Text style={[styles.messageText, styles.systemMessageText]}>
              {item.text}
            </Text>
          </View>
        </View>
      );
    } else {
      return (
        <View
          style={[
            styles.messageBubble,
            styles.userBubble,
            { alignSelf: 'flex-end' },
          ]}
        >
          <Text style={[styles.messageText, styles.userMessageText]}>
            {item.text}
          </Text>
        </View>
      );
    }
  };

  if (loading) {
    return <LoadingAnimation />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#075985" />

      {/* Header */}
      <LinearGradient
        colors={['rgba(8, 145, 178, 0.3)', 'rgba(8, 145, 178, 0.7)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Image
          source={require('@/assets/logo.png')}
          style={styles.logo}
          defaultSource={require('@/assets/logo.png')}
        />
        <Text style={styles.headerTitle}>Virtual Concierge</Text>
      </LinearGradient>

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
              {reply.icon}
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
          placeholder="Ask about your stay..."
          placeholderTextColor="#999"
          value={newMessage}
          onChangeText={setNewMessage}
          onSubmitEditing={() => {
            if (newMessage.trim()) {
              handleSendMessage(newMessage);
            }
          }}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled,
          ]}
          disabled={!newMessage.trim()}
          onPress={() => {
            handleSendMessage(newMessage);
          }}
        >
          <Send size={20} color="#fff" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.05,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#fff',
  },
  messageList: {
    padding: 16,
    paddingBottom: 100,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#0891b2',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  systemBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  systemAvatarContainer: {
    position: 'absolute',
    left: -44,
    bottom: 0,
  },
  systemMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    maxWidth: '80%',
  },
  systemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    marginRight: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  systemMessageText: {
    color: '#334155',
  },
  quickRepliesContainer: {
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  quickReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  quickReplyText: {
    color: '#0891b2',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 24,
    marginRight: 10,
    color: '#334155',
    backgroundColor: '#f8fafc',
  },
  sendButton: {
    backgroundColor: '#0891b2',
    padding: 14,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
});
