import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { DocumentItem } from '@/types';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  selectedDocument?: DocumentItem | null;
  selectedDocuments?: DocumentItem[];
  onClearContext?: () => void;
  onRemoveDocument?: (doc: DocumentItem | string) => void;
  onOpenDocumentsSheet?: () => void;
  onSnapCameraPress?: () => void;
}

export function ChatInput({
  onSend,
  disabled = false,
  selectedDocument,
  selectedDocuments = [],
  onClearContext,
  onRemoveDocument,
  onOpenDocumentsSheet,
  onSnapCameraPress,
}: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const formatDocName = (name?: string) => {
    if (!name) return '';
    try {
      return decodeURIComponent(name);
    } catch {
      return name;
    }
  };

  const isSendDisabled = !text.trim() || disabled;
  const multiCount = selectedDocuments.length;
  const singleDoc = multiCount === 1 ? selectedDocuments[0] : selectedDocument;

  const placeholderText =
    multiCount > 1
      ? `Ask across ${multiCount} selected documents...`
      : singleDoc
      ? `Ask about ${formatDocName(singleDoc.name)}...`
      : 'Ask about your documents...';

  const helperText =
    multiCount > 1
      ? `Cross-referencing ${multiCount} documents • Grounded with citations`
      : singleDoc
      ? `Grounded in ${formatDocName(singleDoc.name)} • Cites page & sections`
      : 'Ask a question about your uploaded documents';

  return (
    <View style={styles.container}>
      {/* Multi-Document Context Bar */}
      {multiCount > 1 && (
        <View style={styles.multiContextBar}>
          <View style={styles.multiContextTopRow}>
            <View style={styles.multiContextTitleGroup}>
              <Ionicons name="layers" size={13} color={Colors.primaryCyan} />
              <Text style={styles.multiContextTitle}>
                Active Context: {multiCount} Documents
              </Text>
            </View>
            <View style={styles.multiContextActions}>
              {onOpenDocumentsSheet && (
                <Pressable
                  onPress={onOpenDocumentsSheet}
                  hitSlop={6}
                  style={styles.manageDocsBtn}
                >
                  <Text style={styles.manageDocsText}>+ Add / Edit</Text>
                </Pressable>
              )}
              {onClearContext && (
                <Pressable
                  onPress={onClearContext}
                  hitSlop={6}
                  style={styles.clearAllBtn}
                >
                  <Text style={styles.clearAllText}>Clear All</Text>
                </Pressable>
              )}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.docChipsScroll}
          >
            {selectedDocuments.map((doc) => (
              <View key={doc.id} style={styles.docChip}>
                <Ionicons name="document-text-outline" size={11} color={Colors.primaryCyan} />
                <Text style={styles.docChipName} numberOfLines={1}>
                  {formatDocName(doc.name)}
                </Text>
                {onRemoveDocument && (
                  <Pressable
                    onPress={() => onRemoveDocument(doc)}
                    hitSlop={6}
                    style={styles.docChipClose}
                  >
                    <Ionicons name="close" size={11} color={Colors.textMuted} />
                  </Pressable>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Single Document Context Bar */}
      {multiCount <= 1 && singleDoc && (
        <View style={styles.contextBar}>
          <View style={styles.contextPill}>
            <Ionicons name="document-text-outline" size={13} color={Colors.primaryCyan} />
            <Text style={styles.contextText} numberOfLines={1}>
              Context: {formatDocName(singleDoc.name)}
            </Text>
            {onClearContext && (
              <Pressable
                onPress={onClearContext}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearContextButton}
                accessibilityLabel="Clear document filter"
              >
                <Ionicons name="close" size={13} color={Colors.primaryCyan} />
              </Pressable>
            )}
          </View>
          {onOpenDocumentsSheet && (
            <Pressable
              onPress={onOpenDocumentsSheet}
              hitSlop={6}
              style={styles.addMoreDocsBtn}
            >
              <Text style={styles.addMoreDocsText}>+ Multi-Select</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Main input container */}
      <View style={styles.inputBox}>
        {onSnapCameraPress && (
          <Pressable
            onPress={onSnapCameraPress}
            style={({ pressed }) => [styles.cameraBtn, pressed && styles.cameraBtnPressed]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Snap purchase bill with camera"
          >
            <Ionicons name="camera" size={20} color={Colors.secondary} />
          </Pressable>
        )}

        <TextInput
          style={styles.textInput}
          placeholder={placeholderText}
          placeholderTextColor={Colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
          editable={!disabled}
          returnKeyType={Platform.OS === 'ios' ? 'default' : 'send'}
          blurOnSubmit={false}
        />

        <Pressable
          onPress={handleSend}
          disabled={isSendDisabled}
          style={({ pressed }) => [
            styles.sendButton,
            !isSendDisabled && styles.sendButtonActive,
            pressed && !isSendDisabled && styles.sendButtonPressed,
          ]}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Ionicons
            name="arrow-up"
            size={18}
            color={isSendDisabled ? Colors.textMuted : '#FFFFFF'}
          />
        </Pressable>
      </View>

      <Text style={styles.helperText}>{helperText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderWidth: 1,
    borderColor: Colors.borderCyan,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '75%',
  },
  contextText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.primaryCyan,
    flexShrink: 1,
  },
  clearContextButton: {
    marginLeft: 4,
  },
  addMoreDocsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 6,
  },
  addMoreDocsText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textMuted,
  },
  multiContextBar: {
    marginBottom: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 6,
    gap: 6,
  },
  multiContextTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  multiContextTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  multiContextTitle: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
  },
  multiContextActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manageDocsBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: 4,
  },
  manageDocsText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: '600',
  },
  clearAllBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  clearAllText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textMuted,
  },
  docChipsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 160,
  },
  docChipName: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  docChipClose: {
    marginLeft: 2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 46,
    maxHeight: 110,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  textInput: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingTop: 6,
    paddingBottom: 6,
    minHeight: 34,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  sendButtonPressed: {
    opacity: 0.8,
  },
  cameraBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  cameraBtnPressed: {
    opacity: 0.6,
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
  },
  helperText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
});
