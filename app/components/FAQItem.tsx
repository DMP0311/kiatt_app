import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type FAQItemProps = {
  question: string;
  answer: string;
};

export default function FAQItem({ question, answer }: FAQItemProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.faqItem}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <Text style={styles.faqQuestion}>{question}</Text>
      </TouchableOpacity>
      {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  faqItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  faqQuestion: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  faqAnswer: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginTop: 12,
  },
});
