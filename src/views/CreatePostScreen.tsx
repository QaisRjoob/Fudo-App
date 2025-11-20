import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { CreatePostViewModel } from '../viewmodels';
import { Ionicons } from '@expo/vector-icons';

export const CreatePostScreen = observer(({ navigation }: any) => {
  const [viewModel] = useState(() => new CreatePostViewModel());
  const [currentUserId] = useState('current-user');

  const handleCreate = async () => {
    const post = await viewModel.createPost(currentUserId);
    if (post) {
      Alert.alert('Success', 'Post created successfully!');
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity 
          onPress={handleCreate}
          disabled={viewModel.isUploading || viewModel.media.length === 0}
        >
          <Text style={[
            styles.postButton,
            (viewModel.isUploading || viewModel.media.length === 0) && styles.postButtonDisabled
          ]}>
            Post
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Media Selection */}
        <View style={styles.mediaSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {viewModel.media.map((item, index) => (
              <View key={item.id} style={styles.mediaItem}>
                <Image
                  source={{ uri: item.localUri || item.remoteUri }}
                  style={styles.mediaImage}
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => viewModel.removeMedia(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            
            {viewModel.media.length < 10 && (
              <TouchableOpacity
                style={styles.addMediaButton}
                onPress={() => viewModel.pickImages()}
              >
                <Ionicons name="add" size={40} color="#007AFF" />
                <Text style={styles.addMediaText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Caption Input */}
        <TextInput
          style={styles.captionInput}
          placeholder="Write a caption... Share your recipe!"
          placeholderTextColor="#999"
          multiline
          value={viewModel.caption}
          onChangeText={(text) => viewModel.setCaption(text)}
          maxLength={2200}
        />

        {viewModel.isUploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.uploadingText}>
              Uploading... {Math.round(viewModel.uploadProgress)}%
            </Text>
          </View>
        )}

        {viewModel.error && (
          <Text style={styles.errorText}>{viewModel.error}</Text>
        )}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  postButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  postButtonDisabled: {
    color: '#ccc',
  },
  content: {
    flex: 1,
  },
  mediaSection: {
    padding: 16,
  },
  mediaItem: {
    marginRight: 12,
    position: 'relative',
  },
  mediaImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  addMediaButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMediaText: {
    color: '#007AFF',
    fontSize: 12,
    marginTop: 4,
  },
  captionInput: {
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  uploadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    color: '#ff3b30',
    padding: 16,
    textAlign: 'center',
  },
});
