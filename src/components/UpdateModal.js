import React from 'react';
import { View, StyleSheet, Modal, Linking, ScrollView } from 'react-native';
import { Text, Button, Surface, IconButton } from 'react-native-paper';
import { useExpenses } from '../context/ExpenseContext';

export default function UpdateModal() {
  const { updateAvailable, setUpdateAvailable, colors } = useExpenses();

  if (!updateAvailable) return null;

  const { version, whatsNew, downloadUrl } = updateAvailable;

  const handleUpdate = () => {
    Linking.openURL(downloadUrl); // Opens Browser to Download APK
  };

  const handleLater = () => {
    setUpdateAvailable(null); // Close Modal
  };

  return (
    <Modal transparent animationType="slide" visible={!!updateAvailable}>
      <View style={styles.overlay}>
        <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={5}>
          
          {/* Header Image / Icon */}
          <View style={[styles.iconHeader, { backgroundColor: colors.inputBg }]}>
             <IconButton icon="rocket-launch" size={40} iconColor={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Update Available! 🚀</Text>
          <Text style={[styles.version, { color: colors.primary }]}>New Version {version} is available</Text>

          <Text style={[styles.sectionTitle, { color: colors.textSec }]}>WHAT NEW:</Text>
          
          <ScrollView style={styles.scroll} contentContainerStyle={{paddingBottom: 10}}>
            {whatsNew.map((item, index) => (
                <View key={index} style={styles.row}>
                    <Text style={{color: colors.success, marginRight: 8}}>✓</Text>
                    <Text style={[styles.feature, { color: colors.text }]}>{item}</Text>
                </View>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <Button 
                mode="text" 
                onPress={handleLater} 
                textColor={colors.textSec}
            >
                Maybe Later
            </Button>
            <Button 
                mode="contained" 
                onPress={handleUpdate} 
                buttonColor={colors.primary} 
                textColor="#FFF"
                contentStyle={{ paddingHorizontal: 10 }}
            >
                Update Now
            </Button>
          </View>

        </Surface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  card: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center' },
  iconHeader: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  version: { fontSize: 14, fontWeight: 'bold', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },
  sectionTitle: { width: '100%', fontSize: 12, fontWeight: 'bold', marginBottom: 10, alignSelf: 'flex-start' },
  scroll: { width: '100%', maxHeight: 150, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  feature: { fontSize: 15, lineHeight: 20, flex: 1 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 }
});