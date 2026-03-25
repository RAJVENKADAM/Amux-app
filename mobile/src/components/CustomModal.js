import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const CustomModal = ({
  visible,
  onClose,
  title,
  message,
  buttons = [],
  destructiveIndex = -1
}) => {
  const { theme } = useTheme();

  const defaultButtons = [
    { text: 'Cancel', onPress: onClose, style: 'cancel' }
  ];

  const allButtons = buttons.length > 0 ? buttons : defaultButtons;

  if (!theme) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Pressable style={styles.overlay} onPress={onClose}>
        
        {/* Prevent closing when clicking inside */}
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%' }}>
          <View
            style={[
              styles.container,
              {
                backgroundColor: theme.surface,
                shadowColor: theme.text
              }
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>
                {title}
              </Text>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Message */}
            {message && (
              <Text
                style={[
                  styles.message,
                  { color: theme.textSecondary }
                ]}
              >
                {message}
              </Text>
            )}

            {/* Buttons (VERTICAL) */}
            <View style={styles.buttonsContainer}>
              {allButtons.map((button, index) => {
                const isDestructive =
                  button.style === 'destructive' || destructiveIndex === index;

                const isCancel = button.style === 'cancel';

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      isCancel && [
                        styles.cancelButton,
                        { borderColor: theme.primary }
                      ],
                      isDestructive && styles.destructiveButton
                    ]}
                    onPress={button.onPress}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel && { color: theme.primary },
                        isDestructive && { color: '#EF4444' }
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1
  },
  closeBtn: {
    padding: 4
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center'
  },
  buttonsContainer: {
    flexDirection: 'column' // vertical layout
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 6,
    backgroundColor: '#eee'
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent'
  },
  destructiveButton: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: '#EF4444'
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600'
  }
});

export default CustomModal;