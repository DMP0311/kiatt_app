import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Footer() {
  return (
    <View style={styles.footer}>
      <View style={styles.footerLinks}>
        <TouchableOpacity>
          <Text style={styles.footerLinkText}>About Us</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.footerLinkText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.footerLinkText}>Terms of Service</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.footerLinkText}>Contact</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.footerCopy}>
        © 2025 Kiatt Resort & Spa. All rights reserved.
      </Text>
      {/* .. */}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
    alignItems: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  footerLinkText: {
    marginHorizontal: 8,
    color: '#64748b',
    fontSize: 14,
  },
  footerCopy: {
    color: '#64748b',
    fontSize: 14,
  },
});
